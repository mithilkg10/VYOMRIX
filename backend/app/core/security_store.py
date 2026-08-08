import asyncio
import time
from typing import Optional, Any

class SecurityStateStore:
    async def get(self, key: str) -> Optional[Any]: pass
    async def setex(self, key: str, seconds: int, value: Any) -> None: pass
    async def incr(self, key: str) -> int: pass
    async def expire(self, key: str, seconds: int) -> None: pass

class MemorySecurityStateStore(SecurityStateStore):
    def __init__(self):
        self._store = {}
        self._lock = asyncio.Lock()

    def _cleanup(self):
        now = time.time()
        expired = [k for k, v in self._store.items() if v['expires'] and v['expires'] <= now]
        for k in expired:
            del self._store[k]

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            self._cleanup()
            if key in self._store:
                return self._store[key]['value']
            return None

    async def setex(self, key: str, seconds: int, value: Any) -> None:
        async with self._lock:
            self._cleanup()
            self._store[key] = {
                'value': value,
                'expires': time.time() + seconds
            }

    async def incr(self, key: str) -> int:
        async with self._lock:
            self._cleanup()
            if key not in self._store:
                self._store[key] = {'value': 0, 'expires': None}
            self._store[key]['value'] = int(self._store[key]['value']) + 1
            return self._store[key]['value']

    async def expire(self, key: str, seconds: int) -> None:
        async with self._lock:
            if key in self._store:
                self._store[key]['expires'] = time.time() + seconds

import redis.asyncio as redis
import logging
from app.core.config import settings
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class RedisSecurityStateStore(SecurityStateStore):
    def __init__(self):
        self._pool = redis.ConnectionPool.from_url(settings.REDIS_URI, decode_responses=True)
        self._client = redis.Redis(connection_pool=self._pool)

    def _ensure_connected(self):
        # We rely on redis-py's connection pooling and auto-reconnect,
        # but we must fail closed if an operation fails.
        pass

    async def get(self, key: str) -> Optional[Any]:
        try:
            return await self._client.get(key)
        except Exception as e:
            logger.error(f"Redis get failed: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Security state store unavailable")

    async def setex(self, key: str, seconds: int, value: Any) -> None:
        try:
            await self._client.setex(key, seconds, value)
        except Exception as e:
            logger.error(f"Redis setex failed: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Security state store unavailable")

    async def incr(self, key: str) -> int:
        try:
            return await self._client.incr(key)
        except Exception as e:
            logger.error(f"Redis incr failed: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Security state store unavailable")

    async def expire(self, key: str, seconds: int) -> None:
        try:
            await self._client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire failed: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Security state store unavailable")
            
    async def ping(self) -> bool:
        try:
            return await self._client.ping()
        except Exception:
            return False

_store_instance = None

async def init_security_store():
    global _store_instance
    if settings.VYOMRIX_RUNTIME == "local":
        _store_instance = MemorySecurityStateStore()
        logger.info("Initialized MemorySecurityStateStore for Local Native Mode.")
    else:
        _store_instance = RedisSecurityStateStore()
        logger.info("Initialized RedisSecurityStateStore.")

async def get_security_store() -> SecurityStateStore:
    return _store_instance
