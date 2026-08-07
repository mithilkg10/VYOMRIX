import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
import redis.exceptions
from app.domains.auth.services import AuthService
from app.core.rate_limit import RateLimiter

@pytest.mark.asyncio
async def test_redis_failure_rate_limit(db_session, setup_test_user):
    # Test Redis being unavailable during Login rate limiting
    limiter = RateLimiter(times=5, seconds=60)
    
    # Mock get_redis to return a Redis object that raises an error on incr
    mock_redis = AsyncMock()
    mock_redis.incr.side_effect = redis.exceptions.ConnectionError("Redis down")
    
    with patch("app.core.rate_limit.get_redis", return_value=mock_redis):
        # Fail closed: If Redis is down, rate limiter must deny access
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            from fastapi import Request
            mock_request = type('Request', (), {'client': type('Client', (), {'host': '127.0.0.1'})(), 'url': type('URL', (), {'path': '/login'})()})()
            await limiter(mock_request)
        assert exc.value.status_code == 503
        assert "Service temporarily unavailable" in exc.value.detail


