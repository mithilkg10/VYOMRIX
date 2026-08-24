"""Create one local-only development account without storing credentials in source."""

import asyncio
import os
import sys
import uuid

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.domains.auth.models import UserModel
from app.domains.auth.services import AuthService

ALLOWED_ENVIRONMENTS = {"development", "local", "test"}


def get_seed_configuration() -> tuple[str, str]:
    if settings.ENVIRONMENT.lower() not in ALLOWED_ENVIRONMENTS:
        raise RuntimeError("Development user seeding is disabled outside local, test, and development environments.")
    if os.getenv("DEV_SEED_ENABLED", "").lower() != "true":
        raise RuntimeError("Set DEV_SEED_ENABLED=true to run the development user seed command.")

    email = os.getenv("DEV_SEED_EMAIL")
    password = os.getenv("DEV_SEED_PASSWORD")
    if not email or not password:
        raise RuntimeError("DEV_SEED_EMAIL and DEV_SEED_PASSWORD must both be set.")
    return email, password


async def seed_development_user() -> None:
    email, password = get_seed_configuration()
    auth_service = AuthService()
    async with AsyncSessionLocal() as session:
        existing_user = await auth_service.get_user_by_email(session, email)
        if existing_user:
            if os.getenv("DEV_SEED_RESET_PASSWORD", "").lower() == "true":
                existing_user.hashed_password = auth_service.get_password_hash(password)
                existing_user.is_active = True
                existing_user.failed_login_attempts = 0
                existing_user.locked_until = None
                await session.commit()
                print(f"Development user password reset for {email}.")
                return
            print(f"Development user already exists for {email}; no changes made.")
            return

        from app.domains.auth.permissions import RoleEnum, PermissionsEnum
        
        development_user = UserModel(
            id=f"USR-{uuid.uuid4().hex[:8]}",
            email=email,
            hashed_password=auth_service.get_password_hash(password),
            full_name="Local Development Administrator",
            role=RoleEnum.SUPER_ADMIN.value,
            permissions=[PermissionsEnum.ADMIN_ALL.value],
        )
        session.add(development_user)
        await session.commit()
        print(f"Development user created for {email}.")


if __name__ == "__main__":
    try:
        asyncio.run(seed_development_user())
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1) from error
