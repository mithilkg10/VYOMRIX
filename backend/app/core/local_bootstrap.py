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
    from app.core.bootstrap import bootstrap_system
    await bootstrap_system()

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
