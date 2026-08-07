from fastapi import Request, HTTPException
from typing import Callable
from datetime import datetime
import logging

from app.core.redis import get_redis

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request):
        redis = await get_redis()
        # If Redis is unavailable, we fail open (log warning) to ensure service continues.
        # But for critical endpoints we might want to fail close. 
        # The prompt says: "Use a secure fallback or fail safely with a controlled service-unavailable response. Do not allow an unavailable Redis instance to disable security controls silently."
        # We will fail safely by returning 503 Service Unavailable if Redis is down for critical actions.
        if not redis:
            logger.error("Redis is unavailable, rejecting rate-limited request.")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable (Rate Limiter)")

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = f"rate_limit:{path}:{client_ip}"
        
        try:
            current = await redis.incr(key)
            if current == 1:
                await redis.expire(key, self.seconds)
            
            if current > self.times:
                raise HTTPException(status_code=429, detail="Too Many Requests")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Redis rate limiting error: {e}")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
