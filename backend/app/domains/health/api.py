from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/")
@router.get("/status")
async def health_check():
    return {
        "status": "ok",
        "service": "Vyomrix Backend API",
        "version": "1.0.0"
    }

@router.get("/live")
async def liveness_probe():
    """Kubernetes liveness probe - returns 200 if process is running."""
    return {"status": "alive"}

@router.get("/ready")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Kubernetes readiness probe - checks database and security store connectivity."""
    status_details = {"database": "connected", "security_store": "connected"}
    
    # 1. Check DB
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        status_details["database"] = "unavailable"
        
    # 2. Check Security Store (Redis)
    from app.core.security_store import get_security_store
    store = await get_security_store()
    if store and hasattr(store, 'ping'):
        if not await store.ping():
            status_details["security_store"] = "unavailable"
            
    if "unavailable" in status_details.values():
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail={"status": "degraded", **status_details})
        
    return {"status": "ready", **status_details}
