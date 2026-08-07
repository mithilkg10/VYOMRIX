#!/usr/bin/env python3
"""
Production Bootstrap Script for Vyomrix.
Initializes the database and creates the first admin user interactively
if one does not exist.
"""
import asyncio
import getpass
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal
from app.domains.auth.models import UserModel
from app.domains.auth.security import get_password_hash

async def check_users_exist(session: AsyncSession) -> bool:
    result = await session.execute(select(UserModel).limit(1))
    return result.scalars().first() is not None

async def create_admin_user(session: AsyncSession, email: str, password: str, full_name: str) -> None:
    hashed_pw = get_password_hash(password)
    new_user = UserModel(
        email=email,
        hashed_password=hashed_pw,
        full_name=full_name,
        role="admin",
        is_active=True
    )
    session.add(new_user)
    await session.commit()
    print(f"✅ Admin user {email} created successfully.")

async def main():
    print("🚀 Vyomrix Production Bootstrap Tool")
    print("-" * 40)
    
    try:
        async with SessionLocal() as session:
            # Check if any users exist
            if await check_users_exist(session):
                print("✅ Users already exist in the database. Bootstrapping complete.")
                return

            print("⚠️ No users found. Let's create the initial administrator account.")
            email = input("Admin Email: ").strip()
            while not email:
                print("Email cannot be empty.")
                email = input("Admin Email: ").strip()

            full_name = input("Admin Full Name: ").strip()
            
            password = getpass.getpass("Admin Password: ")
            while len(password) < 8:
                print("Password must be at least 8 characters.")
                password = getpass.getpass("Admin Password: ")
                
            password_confirm = getpass.getpass("Confirm Password: ")
            while password != password_confirm:
                print("Passwords do not match.")
                password = getpass.getpass("Admin Password: ")
                password_confirm = getpass.getpass("Confirm Password: ")
            
            await create_admin_user(session, email, password, full_name)
    except Exception as e:
        print(f"❌ Error connecting to the database: {e}")
        print("Ensure that postgres is running and accessible (check POSTGRES_SERVER environment variables).")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
