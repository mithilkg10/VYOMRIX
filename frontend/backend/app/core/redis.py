import redis.asyncio as redis
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize a global redis connection pool
redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    try:
        redis_client = redis.from_url(f"redis://{settings.REDIS_HOST}:6379/0", decode_responses=True)
        await redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None

async def get_redis() -> Optional[redis.Redis]:
    return redis_client
