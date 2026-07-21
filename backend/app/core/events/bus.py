import asyncio
import logging
import json
from typing import Callable, Dict, List, Any
from enum import Enum
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    ALERT_CREATED = "AlertCreated"
    ALERT_ENRICHED = "AlertEnriched"
    THREAT_LOOKUP_COMPLETED = "ThreatLookupCompleted"
    AI_ANALYSIS_COMPLETED = "AIAnalysisCompleted"
    INCIDENT_CREATED = "IncidentCreated"
    INCIDENT_UPDATED = "IncidentUpdated"
    WAF_ATTACK_DETECTED = "WAFAttackDetected"
    HONEYPOT_INTERACTION_DETECTED = "HoneypotInteractionDetected"

class Event(BaseModel):
    event_type: EventType
    payload: Dict[str, Any]
    source_module: str

# Type alias for event handler functions
EventHandler = Callable[[Event], Any]

class EventBus:
    """
    Cross-platform internal Event Bus.
    Allows decoupling of major modules (SIEM, AI, Threat Intel).
    Defaults to an in-memory async queue for local reliability, 
    but designed to wrap RabbitMQ/Kafka in production.
    """
    def __init__(self):
        self._subscribers: Dict[EventType, List[EventHandler]] = {
            e: [] for e in EventType
        }
        self._queue = asyncio.Queue()
        self._is_running = False
        self._worker_task = None

    def subscribe(self, event_type: EventType, handler: EventHandler):
        """Register a handler for a specific event type."""
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler {handler.__name__} to {event_type.value}")

    async def publish(self, event: Event):
        """Publish an event to the bus."""
        logger.debug(f"Publishing event {event.event_type.value} from {event.source_module}")
        await self._queue.put(event)

    async def _worker(self):
        """Background worker to process events from the queue."""
        while self._is_running:
            try:
                event = await self._queue.get()
                handlers = self._subscribers.get(event.event_type, [])
                
                # Execute handlers concurrently
                tasks = []
                for handler in handlers:
                    if asyncio.iscoroutinefunction(handler):
                        tasks.append(handler(event))
                    else:
                        # Wrap synchronous handlers
                        tasks.append(asyncio.to_thread(handler, event))
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
                    
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"EventBus worker error: {e}")

    def start(self):
        """Start the background event processing loop."""
        if not self._is_running:
            self._is_running = True
            self._worker_task = asyncio.create_task(self._worker())
            logger.info("EventBus started")

    async def stop(self):
        """Stop the event processing loop."""
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("EventBus stopped")

# Global singleton event bus
event_bus = EventBus()
