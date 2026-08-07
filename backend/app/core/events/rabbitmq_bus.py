import asyncio
import logging
import json
import uuid
import aio_pika
from typing import Callable, Dict, List, Any, Optional
from app.core.config import settings
from app.core.events.bus import BaseEventBus, Event, EventType, EventHandler

logger = logging.getLogger(__name__)

class RabbitMQEventBus(BaseEventBus):
    def __init__(self):
        super().__init__()
        self.connection: Optional[aio_pika.RobustConnection] = None
        self.channel: Optional[aio_pika.RobustChannel] = None
        self.durable_exchange: Optional[aio_pika.RobustExchange] = None
        self.live_exchange: Optional[aio_pika.RobustExchange] = None
        
        # In-memory mapping for SSE subscriptions (live events)
        self._live_subscribers: Dict[EventType, List[EventHandler]] = {
            e: [] for e in EventType
        }
        
        # Worker subscriptions
        self._worker_handlers: Dict[EventType, EventHandler] = {}
        
        self._is_worker = False
        self._live_queue_tag = None

    async def start(self, is_worker: bool = False):
        self._is_worker = is_worker
        logger.info(f"Connecting to RabbitMQ at {settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}")
        
        # Retry connection logic
        for attempt in range(5):
            try:
                self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URI)
                self.channel = await self.connection.channel()
                
                # 1. Durable Exchange for background processing
                self.durable_exchange = await self.channel.declare_exchange(
                    "vyomrix.events.durable", 
                    aio_pika.ExchangeType.TOPIC,
                    durable=True
                )
                
                # 2. Fanout Exchange for Live Events (SSE)
                self.live_exchange = await self.channel.declare_exchange(
                    "vyomrix.events.live",
                    aio_pika.ExchangeType.FANOUT,
                    durable=True
                )
                
                logger.info("RabbitMQ EventBus connected and exchanges declared.")
                break
            except Exception as e:
                logger.warning(f"RabbitMQ connection failed on attempt {attempt+1}: {e}")
                await asyncio.sleep(2)
        else:
            raise Exception("Failed to connect to RabbitMQ after 5 attempts.")

        if self._is_worker:
            await self._setup_worker_queues()
        else:
            await self._setup_live_event_queues()

    async def _setup_worker_queues(self):
        # Worker binds durable queues
        queue = await self.channel.declare_queue("vyomrix.worker.queue", durable=True)
        # Bind all subscribed event types
        for event_type in self._worker_handlers.keys():
            await queue.bind(self.durable_exchange, routing_key=event_type.value)
            
        async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    payload = json.loads(message.body.decode())
                    event = Event(**payload)
                    handler = self._worker_handlers.get(event.event_type)
                    if handler:
                        logger.info(f"Worker processing event {event.event_type.value}")
                        if asyncio.iscoroutinefunction(handler):
                            await handler(event)
                        else:
                            await asyncio.to_thread(handler, event)
                        
                        # Once processed by worker, broadcast to live exchange for SSE
                        await self.live_exchange.publish(
                            aio_pika.Message(body=message.body),
                            routing_key=""
                        )
                except Exception as e:
                    logger.error(f"Worker failed to process message: {e}")
                    # In a real app, send to DLQ here
                    
        await queue.consume(process_message)
        logger.info("Worker started consuming from durable queue.")

    async def _setup_live_event_queues(self):
        # API replicas bind exclusive, auto-delete queue for SSE
        queue = await self.channel.declare_queue(
            f"vyomrix.live.{uuid.uuid4().hex}", 
            exclusive=True, 
            auto_delete=True
        )
        await queue.bind(self.live_exchange, routing_key="")
        
        async def process_live_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    payload = json.loads(message.body.decode())
                    event = Event(**payload)
                    handlers = self._live_subscribers.get(event.event_type, [])
                    for handler in handlers:
                        if asyncio.iscoroutinefunction(handler):
                            await handler(event)
                        else:
                            await asyncio.to_thread(handler, event)
                except Exception as e:
                    logger.error(f"Error processing live message: {e}")
                    
        self._live_queue_tag = await queue.consume(process_live_message)
        logger.info("API Replica started consuming from live exchange.")

    def subscribe(self, event_type: EventType, handler: EventHandler):
        # By default (in API), subscribe binds to live events for SSE
        self._live_subscribers[event_type].append(handler)
        
    def unsubscribe(self, event_type: EventType, handler: EventHandler):
        if handler in self._live_subscribers[event_type]:
            self._live_subscribers[event_type].remove(handler)

    def subscribe_worker(self, event_type: EventType, handler: EventHandler):
        # Used by worker.py to register durable handlers
        self._worker_handlers[event_type] = handler

    async def publish(self, event: Event):
        if not self.durable_exchange:
            logger.warning("EventBus not started, cannot publish.")
            return
            
        payload_bytes = event.model_dump_json().encode()
        message = aio_pika.Message(
            body=payload_bytes,
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            message_id=uuid.uuid4().hex,
            correlation_id=event.payload.get("id")
        )
        
        # Publish to durable exchange. The worker will pick it up, process it, and forward to live exchange.
        await self.durable_exchange.publish(message, routing_key=event.event_type.value)
        logger.debug(f"Published {event.event_type.value} to RabbitMQ durable exchange.")

    async def stop(self):
        if self.connection:
            await self.connection.close()
            logger.info("RabbitMQ connection closed.")
