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

logger = logging.getLogger(__name__)

class RedisSecurityStateStore(SecurityStateStore):
    def __init__(self):
        self.redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
        self._client = None

    async def connect(self):
        try:
            self._client = redis.from_url(self.redis_url, decode_responses=True)
            await self._client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._client = None

    async def get(self, key: str) -> Optional[Any]:
        if not self._client: return None
        return await self._client.get(key)

    async def setex(self, key: str, seconds: int, value: Any) -> None:
        if not self._client: return
        await self._client.setex(key, seconds, value)

    async def incr(self, key: str) -> int:
        if not self._client: return 1
        return await self._client.incr(key)

    async def expire(self, key: str, seconds: int) -> None:
        if not self._client: return
        await self._client.expire(key, seconds)

_store_instance = None

async def init_security_store():
    global _store_instance
    if settings.VYOMRIX_RUNTIME == "local":
        _store_instance = MemorySecurityStateStore()
        logger.info("Initialized MemorySecurityStateStore for Local Native Mode.")
    else:
        _store_instance = RedisSecurityStateStore()
        await _store_instance.connect()

async def get_security_store() -> SecurityStateStore:
    return _store_instance
