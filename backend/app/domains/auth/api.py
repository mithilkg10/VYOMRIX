from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import RateLimiter
from .services import AuthService
from .schemas import Token, UserCreate, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from .dependencies import get_current_user, RequirePermissions
from .models import UserModel
from .permissions import PermissionsEnum

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()

@router.post("/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await auth_service.get_user_by_email(db, email=form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        
    if await auth_service.check_lockout(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account locked")

    if not auth_service.verify_password(form_data.password, user.hashed_password):
        await auth_service.handle_failed_login(db, user)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    await auth_service.handle_successful_login(db, user)
    
    # Capture metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Create durable refresh session
    session_data = await auth_service.create_refresh_session(db, user.id, ip_address, user_agent)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "permissions": user.permissions},
        expires_delta=access_token_expires
    )
    refresh_token = auth_service.create_refresh_token(
        data={"sub": user.email},
        jti=session_data["jti"],
        family_id=session_data["family_id"]
    )
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "session_id": session_data["session_id"]
    }

from pydantic import BaseModel

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def refresh_access_token(
    request: Request,
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(body.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")
        family_id: str = payload.get("family_id")
        if email is None or token_type != "refresh" or not jti or not family_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await auth_service.get_user_by_email(db, email=email)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Capture metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Rotate refresh token atomically (also detects replay attacks)
    session_data = await auth_service.rotate_refresh_token(db, jti, family_id, ip_address, user_agent)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked or replay detected")

    # If it's a grace rotation, check Redis for the exact cached token
    from app.core.security_store import get_security_store
    import json
    
    store = await get_security_store()
    
    if session_data.get("is_grace") and store:
        cached = await store.get(f"grace_token:{jti}")
        if cached:
            return json.loads(cached)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "permissions": user.permissions},
        expires_delta=access_token_expires
    )
    new_refresh_token = auth_service.create_refresh_token(
        data={"sub": user.email},
        jti=session_data["jti"],
        family_id=session_data["family_id"]
    )
    
    response_data = {
        "access_token": access_token, 
        "refresh_token": new_refresh_token, 
        "token_type": "bearer",
        "session_id": session_data["session_id"]
    }
    
    # If not a grace rotation, cache the exact response for 5 seconds
    if not session_data.get("is_grace") and store:
        await store.setex(f"grace_token:{jti}", 5, json.dumps(response_data))
        
    return response_data

@router.post("/logout")
async def logout(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    await auth_service.revoke_session(db, session_id, reason="user_logout")
    return {"status": "success"}

@router.post("/sessions/revoke-all")
async def revoke_all_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    await auth_service.revoke_all_user_sessions(db, current_user.id, reason="user_revoked_all")
    return {"status": "success"}

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.USERS_MANAGE]))
):
    existing_user = await auth_service.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        user = await auth_service.create_user(db, user_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password", dependencies=[Depends(RateLimiter(times=3, seconds=300))])
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    token = await auth_service.generate_password_reset_token(db, request.email)
    if token:
        # Sandbox mode logging
        # In a real environment, this would send an email via Celery/SMTP.
        if settings.VYOMRIX_SANDBOX:
            print(f"[SANDBOX] Password reset requested for {request.email}. Token: {token}")
    
    # Always return success to prevent email enumeration
    return {"status": "success", "message": "If the email is registered, a password reset link has been sent."}

@router.post("/reset-password", dependencies=[Depends(RateLimiter(times=5, seconds=300))])
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        success = await auth_service.reset_password_with_token(db, request.token, request.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
        
    return {"status": "success", "message": "Password successfully reset"}
