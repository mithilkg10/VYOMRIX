from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.config import settings
from app.core.database import get_db
from .services import AuthService
from .schemas import TokenData
from .models import UserModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
auth_service = AuthService()

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, permissions=payload.get("permissions", []))
    except JWTError:
        raise credentials_exception
        
    user = await auth_service.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise credentials_exception
    return user

from .permissions import PermissionsEnum

class RequirePermissions:
    def __init__(self, required_permissions: List[PermissionsEnum]):
        self.required_permissions = [p.value for p in required_permissions]

    async def __call__(self, current_user: UserModel = Depends(get_current_user)):
        user_perms = set(current_user.permissions)
        # Super admin bypass
        if PermissionsEnum.ADMIN_ALL.value in user_perms:
            return current_user
            
        for perm in self.required_permissions:
            if perm not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not enough permissions. Requires: {perm}"
                )
        return current_user
