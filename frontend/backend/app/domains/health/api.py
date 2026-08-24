from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

async def get_system_status(db: AsyncSession):
    status_details = {"database": "connected", "security_store": "connected", "event_bus": "connected"}
    
    # 1. Check DB
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        status_details["database"] = "unavailable"
        
    # 2. Check Security Store (Redis)
    from app.core.security_store import get_security_store
    store = await get_security_store()
    if store and hasattr(store, 'ping'):
        try:
            if not await store.ping():
                status_details["security_store"] = "unavailable"
        except Exception:
            status_details["security_store"] = "unavailable"
            
    # 3. Check Event Bus (RabbitMQ)
    from app.core.events.bus import event_bus
    from app.core.events.rabbitmq_bus import RabbitMQEventBus
    if isinstance(event_bus, RabbitMQEventBus):
        if not event_bus.connection or event_bus.connection.is_closed:
            status_details["event_bus"] = "unavailable"

    status = "degraded" if "unavailable" in status_details.values() else "ok"
    return status, status_details

@router.get("/")
@router.get("/status")
async def health_check(db: AsyncSession = Depends(get_db)):
    status, details = await get_system_status(db)
    return {
        "status": status,
        "service": "Vyomrix Backend API",
        "version": "1.0.0",
        "details": details
    }

@router.get("/live")
async def liveness_probe():
    """Kubernetes liveness probe - returns 200 if process is running."""
    return {"status": "alive"}

@router.get("/ready")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Kubernetes readiness probe - checks database, security store, and bus connectivity."""
    status, details = await get_system_status(db)
    if status == "degraded":
        raise HTTPException(status_code=503, detail={"status": "degraded", **details})
    return {"status": "ready", **details}
