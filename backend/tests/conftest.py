import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


from app.core.database import AsyncSessionLocal
from app.domains.auth.services import AuthService
from app.domains.auth.schemas import UserCreate
import uuid
from app.core.redis import init_redis

@pytest_asyncio.fixture(autouse=True)
async def init_redis_for_tests():
    await init_redis()
    from app.core.redis import get_redis
    redis_client = await get_redis()
    if redis_client:
        await redis_client.flushdb()

from app.core.middleware import AuditMiddleware
original_log_async = AuditMiddleware.log_async
async def mock_log_async(self, log_data):
    pass
AuditMiddleware.log_async = mock_log_async

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def setup_test_user():
    email = f"test_{uuid.uuid4().hex}@example.com"
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=email,
            password="testpassword123",
            full_name="Test Concurrency User",
            role="analyst"
        )
        return await AuthService().create_user(db, user_in)

