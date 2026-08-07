import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rate_limit_redis_integration(async_client: AsyncClient):
    """
    Test rate limit enforcement.
    The login route is typically rate limited (e.g. 5 requests per minute).
    We will hit a non-existent login with wrong credentials multiple times to trigger the 429 Too Many Requests response.
    """
    url = "/api/v1/auth/login"
    login_data = {"username": "test_rate_limit@example.com", "password": "wrongpassword"}
    
    # Fire requests sequentially until we get a 429
    responses = []
    for _ in range(10):
        resp = await async_client.post(url, data=login_data)
        responses.append(resp.status_code)
        if resp.status_code == 429:
            break
            
    # We should have received a 429 (Too Many Requests)
    assert 429 in responses, f"Expected 429 Too Many Requests, but got {responses}"
    
    # We should have received 401 (Unauthorized) before hitting the limit
    assert 401 in responses, f"Expected 401 Unauthorized initially, but got {responses}"
