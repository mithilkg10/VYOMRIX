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
    """Kubernetes readiness probe - checks database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail={"status": "degraded", "database": "unavailable", "message": "Database readiness check failed."})
