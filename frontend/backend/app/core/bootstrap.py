import logging
import os
import uuid
import secrets
import string
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.domains.auth.models import UserModel
from app.core.config import settings
from passlib.context import CryptContext

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_secure_password(length=16):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and sum(c.isdigit() for c in password) >= 3):
            break
    return password


async def bootstrap_system():
    """Initializes the database with an admin user and core permissions if empty."""
    async with AsyncSessionLocal() as session:
        stmt = select(UserModel).limit(1)
        result = await session.execute(stmt)
        if result.scalars().first():
            logger.info("Users already exist. Skipping bootstrap.")
            return

        email = settings.VYOMRIX_DEV_ADMIN_EMAIL or "admin@vyomrix.local"

        if settings.VYOMRIX_RUNTIME == "production":
            password = generate_secure_password()
            logger.warning("*" * 60)
            logger.warning("INITIAL PRODUCTION ADMIN CREATED")
            logger.warning(f"Email: {email}")
            logger.warning(f"Password: {password}")
            logger.warning("PLEASE SAVE THIS PASSWORD SECURELY AND CHANGE IT UPON LOGIN")
            logger.warning("*" * 60)
        else:
            password = settings.VYOMRIX_DEV_ADMIN_PASSWORD or "VyomrixAdmin123!"
            logger.info(f"Created local development admin: {email}")

        hashed_password = pwd_context.hash(password)
        admin_id = "00000000-0000-4000-8000-000000000001" if os.getenv("VERCEL") else str(uuid.uuid4())

        admin_user = UserModel(
            id=admin_id,
            email=email,
            hashed_password=hashed_password,
            full_name="System Administrator",
            is_active=True,
            role="Super Admin",
            permissions=["ADMIN_ALL"]
        )

        session.add(admin_user)
        try:
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to bootstrap initial admin: {e}")
            await session.rollback()
