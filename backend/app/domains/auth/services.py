import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete

from app.core.config import settings
from .models import UserModel, RefreshSessionModel
from .schemas import UserCreate, TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc).replace(tzinfo=None) + expires_delta
        else:
            expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict, jti: str, family_id: str) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7) # Refresh token valid for 7 days
        to_encode.update({"exp": expire, "type": "refresh", "jti": jti, "family_id": family_id})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[UserModel]:
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        return result.scalars().first()

    def validate_password_complexity(self, password: str) -> None:
        if len(password) < 12:
            raise ValueError("Password must be at least 12 characters long")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()-_=+[]{}|;:'\",.<>/?`~" for c in password):
            raise ValueError("Password must contain at least one special symbol")

    async def create_user(self, db: AsyncSession, user: UserCreate) -> UserModel:
        self.validate_password_complexity(user.password)
        db_user = UserModel(
            id=f"USR-{uuid.uuid4().hex[:8]}",
            email=user.email,
            hashed_password=self.get_password_hash(user.password),
            full_name=user.full_name,
            role=user.role,
            permissions=user.permissions
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def handle_failed_login(self, db: AsyncSession, user: UserModel):
        """Increment failed logins and lock account if > 5"""
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
        await db.commit()

    async def handle_successful_login(self, db: AsyncSession, user: UserModel):
        """Reset failed logins and update last login"""
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()

    async def check_lockout(self, user: UserModel) -> bool:
        """Returns True if the user is currently locked out"""
        if user.locked_until and user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
            return True
        return False
        
    async def create_refresh_session(self, db: AsyncSession, user_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> dict:
        jti = secrets.token_urlsafe(32)
        family_id = secrets.token_urlsafe(32)
        session_id = f"SESS-{uuid.uuid4().hex[:8]}"
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7)
        
        db_session = RefreshSessionModel(
            id=session_id,
            user_id=user_id,
            jti=jti,
            family_id=family_id,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(db_session)
        await db.commit()
        
        return {"jti": jti, "family_id": family_id, "session_id": session_id}

    async def rotate_refresh_token(self, db: AsyncSession, jti: str, family_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Optional[dict]:
        """Atomically rotates a refresh token. Detects replay attacks and revokes families."""
        # Using row-level locking or optimistic concurrency depending on dialect. For AsyncSession we can use with_for_update()
        result = await db.execute(
            select(RefreshSessionModel).where(RefreshSessionModel.family_id == family_id).with_for_update()
        )
        sessions = result.scalars().all()
        
        if not sessions:
            return None # Invalid family
            
        # Find the active session for this family (the one that hasn't been replaced or revoked)
        # We sort by created_at desc to find the latest
        sessions.sort(key=lambda s: s.created_at, reverse=True)
        active_session = sessions[0]
        
        # If the active session is revoked, or the provided JTI doesn't match the active JTI, this is a REPLAY ATTACK or concurrent refresh reuse.
        if active_session.revoked_at is not None or active_session.jti != jti:
            # Check for legitimate duplicate request within 5-second grace period
            replacement_session = next((s for s in sessions if s.parent_jti == jti), None)
            
            if replacement_session and replacement_session.created_at >= datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=5):
                # Legitimate retry within grace period. Return the same replacement token data.
                return {"jti": replacement_session.jti, "family_id": family_id, "session_id": replacement_session.id, "is_grace": True}
                
            # Replay detection: The token used is old or already rotated outside grace window. Revoke the entire family!
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            for s in sessions:
                if not s.revoked_at:
                    s.revoked_at = now
                    s.revocation_reason = "replay_detected"
                    s.replay_detected_at = now
            await db.commit()
            return None # Deny refresh
            
        # If we got here, it's a valid rotation. Mark old as rotated and create new.
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        new_jti = secrets.token_urlsafe(32)
        new_session_id = f"SESS-{uuid.uuid4().hex[:8]}"
        
        active_session.rotated_at = now
        active_session.replacement_jti = new_jti
        
        new_session = RefreshSessionModel(
            id=new_session_id,
            user_id=active_session.user_id,
            jti=new_jti,
            family_id=family_id,
            parent_jti=jti,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(new_session)
        await db.commit()
        
        return {"jti": new_jti, "family_id": family_id, "session_id": new_session_id, "is_grace": False}

    async def revoke_session(self, db: AsyncSession, session_id: str, reason: str = "user_logout"):
        result = await db.execute(select(RefreshSessionModel).where(RefreshSessionModel.id == session_id))
        session = result.scalars().first()
        if session and not session.revoked_at:
            session.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
            session.revocation_reason = reason
            await db.commit()

    async def revoke_all_user_sessions(self, db: AsyncSession, user_id: str, reason: str = "global_revocation"):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.execute(
            update(RefreshSessionModel)
            .where(RefreshSessionModel.user_id == user_id)
            .where(RefreshSessionModel.revoked_at.is_(None))
            .values(revoked_at=now, revocation_reason=reason)
        )
        await db.commit()

    async def cleanup_expired_sessions(self, db: AsyncSession):
        """Retention policy: Deletes sessions that expired more than 30 days ago to keep table small."""
        threshold = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        await db.execute(
            delete(RefreshSessionModel).where(RefreshSessionModel.expires_at < threshold)
        )
        await db.commit()

    async def generate_password_reset_token(self, db: AsyncSession, email: str) -> Optional[str]:
        user = await self.get_user_by_email(db, email)
        if not user or not user.is_active:
            return None
            
        import hashlib
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        user.reset_token_hash = token_hash
        user.reset_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
        await db.commit()
        return token

    async def reset_password_with_token(self, db: AsyncSession, token: str, new_password: str) -> bool:
        import hashlib
        self.validate_password_complexity(new_password)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        result = await db.execute(
            select(UserModel).where(
                UserModel.reset_token_hash == token_hash,
                UserModel.reset_token_expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
            )
        )
        user = result.scalars().first()
        if not user:
            return False
            
        user.hashed_password = self.get_password_hash(new_password)
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        
        # Invalidate all current sessions for security
        await self.revoke_all_user_sessions(db, user.id, reason="password_reset")
        
        # Log audit event
        from app.domains.audit.services import audit_service
        from app.domains.audit.schemas import AuditLogCreate
        await audit_service.create_log(
            db, 
            AuditLogCreate(
                user_email=user.email,
                action="password_reset",
                target="user",
                resource_id=user.id,
                result="success",
                ip_address="system",
                user_agent="system"
            )
        )
        
        await db.commit()
        return True
