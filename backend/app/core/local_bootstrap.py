import asyncio
import os
import logging
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine

logger = logging.getLogger(__name__)

def run_migrations():
    print("Running Alembic migrations...")
    from alembic import command
    from alembic.config import Config
    alembic_cfg = Config("backend/alembic.ini")
    command.upgrade(alembic_cfg, "head")

async def main_async():
    print("Initializing mock data...")
    from app.core.database import AsyncSessionLocal
    from app.domains.auth.models import UserModel
    from app.core.security import get_password_hash
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        result = await session.execute(select(UserModel).where(UserModel.email == "admin@vyomrix.com"))
        admin_user = result.scalars().first()
        
        if not admin_user:
            admin_user = UserModel(
                id="usr_admin_mock",
                email="admin@vyomrix.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Local Admin",
                is_active=True,
                role="admin",
                permissions=["*"]
            )
            session.add(admin_user)
            await session.commit()
            print("Created local admin user (admin@vyomrix.com / admin123)")

def main():
    if settings.VYOMRIX_RUNTIME != "local":
        print("Not in local runtime mode. Exiting bootstrap.")
        return
        
    if settings.VYOMRIX_SANDBOX:
        print("Sandbox mode detected, removing old database...")
        db_path = "vyomrix_local.db"
        if os.path.exists(db_path):
            os.remove(db_path)
            
    run_migrations()
    asyncio.run(main_async())

if __name__ == "__main__":
    main()
