import asyncio
import logging
import json
import time
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

EventHandler = Callable[[Event], Any]

class DeadLetterStoreInterface:
    async def add(self, event: Event, error: str):
        pass

class MemoryDeadLetterStore(DeadLetterStoreInterface):
    def __init__(self):
        self.dlq = []

    async def add(self, event: Event, error: str):
        self.dlq.append({"event": event, "error": error, "timestamp": time.time()})
        logger.error(f"Event sent to DLQ: {event.event_type.value} due to {error}")

class EventBusMetrics:
    def __init__(self):
        self.retry_count = 0
        self.failed_events = 0
        self.total_processed = 0
        self.total_processing_time_ms = 0.0

    @property
    def average_processing_latency_ms(self) -> float:
        if self.total_processed == 0:
            return 0.0
        return self.total_processing_time_ms / self.total_processed

class EventBus:
    def __init__(self, dlq_store: DeadLetterStoreInterface = None):
        self._subscribers: Dict[EventType, List[EventHandler]] = {
            e: [] for e in EventType
        }
        self._queue = asyncio.Queue(maxsize=5000)
        self._is_running = False
        self._worker_task = None
        self.dlq_store = dlq_store or MemoryDeadLetterStore()
        self.metrics = EventBusMetrics()
        self.max_retries = 3

    def subscribe(self, event_type: EventType, handler: EventHandler):
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler {handler.__name__} to {event_type.value}")

    def unsubscribe(self, event_type: EventType, handler: EventHandler):
        if handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)
            logger.info(f"Unsubscribed handler {handler.__name__} from {event_type.value}")

    async def publish(self, event: Event):
        logger.debug(f"Publishing event {event.event_type.value} from {event.source_module}")
        # Blocks if queue is full (Backpressure)
        await self._queue.put(event)

    async def _execute_with_retry(self, handler: EventHandler, event: Event):
        for attempt in range(1, self.max_retries + 1):
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    await asyncio.to_thread(handler, event)
                return
            except Exception as e:
                self.metrics.retry_count += 1
                logger.warning(f"Handler {handler.__name__} failed on attempt {attempt}: {e}")
                if attempt == self.max_retries:
                    self.metrics.failed_events += 1
                    await self.dlq_store.add(event, str(e))
                else:
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1))) # Exponential backoff

    async def _worker(self):
        while self._is_running:
            try:
                event = await self._queue.get()
                handlers = self._subscribers.get(event.event_type, [])
                
                start_time = time.time()
                tasks = [self._execute_with_retry(handler, event) for handler in handlers]
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                end_time = time.time()
                self.metrics.total_processed += 1
                self.metrics.total_processing_time_ms += (end_time - start_time) * 1000
                    
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"EventBus worker error: {e}")

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._worker_task = asyncio.create_task(self._worker())
            logger.info("EventBus started")

    async def stop(self):
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("EventBus stopped")

    def get_metrics(self) -> dict:
        return {
            "queue_depth": self._queue.qsize(),
            "processing_latency_ms": self.metrics.average_processing_latency_ms,
            "retry_count": self.metrics.retry_count,
            "failed_events": self.metrics.failed_events,
            "dlq_size": len(self.dlq_store.dlq) if hasattr(self.dlq_store, "dlq") else 0,
            "event_throughput": self.metrics.total_processed
        }

event_bus = EventBus()
