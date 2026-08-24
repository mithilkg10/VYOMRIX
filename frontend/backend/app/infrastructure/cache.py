import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
        self.pool = None

    async def connect(self):
        self.pool = redis.ConnectionPool.from_url(self.redis_url, decode_responses=True)
        return redis.Redis(connection_pool=self.pool)

    async def close(self):
        if self.pool:
            await self.pool.disconnect()

redis_client = RedisClient()

async def get_redis():
    client = await redis_client.connect()
    try:
        yield client
    finally:
        await client.close()
