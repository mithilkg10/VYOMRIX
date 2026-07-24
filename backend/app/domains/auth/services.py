import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from .models import UserModel
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
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7) # Refresh token valid for 7 days
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[UserModel]:
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        return result.scalars().first()

    async def create_user(self, db: AsyncSession, user: UserCreate) -> UserModel:
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
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        await db.commit()

    async def handle_successful_login(self, db: AsyncSession, user: UserModel):
        """Reset failed logins and update last login"""
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        await db.commit()

    async def check_lockout(self, user: UserModel) -> bool:
        """Returns True if the user is currently locked out"""
        if user.locked_until and user.locked_until > datetime.utcnow():
            return True
        return False
