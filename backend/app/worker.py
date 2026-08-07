import asyncio
import logging
from app.core.config import settings
from app.core.events.bus import event_bus
from app.core.security_store import init_security_store

# Import all modules that register worker event handlers
# e.g., notifications, etc.
from app.domains.notifications import services as notification_services

from app.core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting Vyomrix Background Worker...")
    
    # Initialize security store for worker
    await init_security_store()
    
    # Initialize event bus for production rabbitmq
    event_bus.initialize(settings.VYOMRIX_RUNTIME)
    
    # Start the event bus in worker mode
    await event_bus.start(is_worker=True)
    
    logger.info("Vyomrix Worker is running and listening for events. Press Ctrl+C to exit.")
    
    # Keep the worker running
    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.info("Worker shutting down...")
    finally:
        await event_bus.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
