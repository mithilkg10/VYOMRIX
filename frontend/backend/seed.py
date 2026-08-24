import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.domains.auth.models import UserModel
from app.domains.auth.services import AuthService

async def seed_user():
    async with async_session_maker() as db_session:
        service = AuthService()
        user = await service.get_user_by_email(db_session, "admin@vyomrix.com")
        if not user:
            print("Creating test user...")
            await service.create_user(db_session, "admin@vyomrix.com", "TestPassword123!", role="admin")
        else:
            print("User already exists.")

if __name__ == "__main__":
    asyncio.run(seed_user())
