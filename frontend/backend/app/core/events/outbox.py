import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.events.models import OutboxEvent, EventStatus
from app.core.events.bus import event_bus, Event, EventType

logger = logging.getLogger(__name__)

async def process_outbox_events():
    """Polls outbox_events and publishes to the event bus."""
    while True:
        try:
            async with AsyncSessionLocal() as session:
                # Use FOR UPDATE SKIP LOCKED for concurrent safe polling
                # SQLite doesn't fully support FOR UPDATE SKIP LOCKED in the same way,
                # but we will handle it with try-except or conditionally
                
                stmt = select(OutboxEvent).where(OutboxEvent.status == EventStatus.PENDING).limit(50).with_for_update(skip_locked=True)
                
                try:
                    result = await session.execute(stmt)
                    events = result.scalars().all()
                except Exception as e:
                    # Fallback for SQLite which might complain about with_for_update
                    stmt = select(OutboxEvent).where(OutboxEvent.status == EventStatus.PENDING).limit(50)
                    result = await session.execute(stmt)
                    events = result.scalars().all()

                if events:
                    for outbox_evt in events:
                        try:
                            # Reconstruct event
                            evt = Event(
                                event_type=EventType(outbox_evt.event_type),
                                payload=outbox_evt.payload,
                                source_module=outbox_evt.source_module,
                                event_id=outbox_evt.id
                            )
                            # Publish without db parameter to actually send to the bus
                            await event_bus.publish(evt)
                            
                            # Mark as completed
                            outbox_evt.status = EventStatus.COMPLETED
                        except Exception as publish_error:
                            logger.error(f"Failed to publish outbox event {outbox_evt.id}: {publish_error}")
                            outbox_evt.status = EventStatus.FAILED
                            outbox_evt.error = str(publish_error)
                    
                    await session.commit()
                else:
                    await asyncio.sleep(2)  # Wait before polling again
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in outbox poller: {e}")
            await asyncio.sleep(5)

class OutboxWorker:
    def __init__(self):
        self._task = None
        
    def start(self):
        if self._task is None:
            self._task = asyncio.create_task(process_outbox_events())
            logger.info("Outbox poller started.")
            
    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("Outbox poller stopped.")

outbox_worker = OutboxWorker()
