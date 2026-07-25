import pytest


@pytest.mark.asyncio
async def test_liveness_is_public_and_safe(async_client):
    response = await async_client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_audit_requires_credentials(async_client):
    response = await async_client.get("/api/v1/audit/")
    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers
