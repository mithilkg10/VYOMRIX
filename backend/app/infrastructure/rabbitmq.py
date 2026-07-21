import aio_pika
from app.core.config import settings

class RabbitMQClient:
    def __init__(self):
        self.connection = None
        self.channel = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URI)
        self.channel = await self.connection.channel()
        return self.channel

    async def close(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()

rabbitmq_client = RabbitMQClient()

async def get_rabbitmq():
    channel = await rabbitmq_client.connect()
    try:
        yield channel
    finally:
        await rabbitmq_client.close()
