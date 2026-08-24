import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.auth.services import AuthService
from app.domains.auth.schemas import UserCreate
from app.core.database import AsyncSessionLocal

auth_service = AuthService()

@pytest.mark.asyncio
async def create_test_user(email: str, role: str = "analyst"):
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=email,
            password="SuperSecretPassword123!",
            full_name="Test User",
            role=role
        )
        return await auth_service.create_user(db, user_in)

@pytest.mark.asyncio
async def test_auth_login(async_client: AsyncClient):
    unique_email = f"test_{uuid.uuid4().hex}@example.com"
    await create_test_user(unique_email)
    
    # Login
    response = await async_client.post(
        "/api/v1/auth/login",
        data={
            "username": unique_email,
            "password": "SuperSecretPassword123!"
        },
        headers={"User-Agent": "Pytest"}
    )
    print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_auth_rbac(async_client: AsyncClient):
    unique_email = f"test_{uuid.uuid4().hex}@example.com"
    await create_test_user(unique_email, role="viewer")
    
    # Login
    login_res = await async_client.post(
        "/api/v1/auth/login",
        data={"username": unique_email, "password": "SuperSecretPassword123!"},
        headers={"User-Agent": "Pytest"}
    )
    print(login_res.json())
    assert login_res.status_code == 200
    
    # Attempt to hit an endpoint
    me_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_res.json()['access_token']}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email

@pytest.mark.asyncio
async def test_auth_forgot_password(async_client: AsyncClient):
    unique_email = f"test_{uuid.uuid4().hex}@example.com"
    await create_test_user(unique_email, role="viewer")
    
    res = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": unique_email}
    )
    print(res.json())
    assert res.status_code == 200
    assert "reset link has been sent" in res.json()["message"]
