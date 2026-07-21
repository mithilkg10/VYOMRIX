from fastapi import APIRouter, Depends
from typing import Dict, Any
from .schemas import WAFEvent
from .services import WAFManager

router = APIRouter(prefix="/waf", tags=["Web Application Firewall"])

def get_waf_manager() -> WAFManager:
    return WAFManager()

@router.post("/ingest", response_model=WAFEvent)
async def ingest_log(
    raw_log: Dict[str, Any],
    manager: WAFManager = Depends(get_waf_manager)
):
    """
    Ingest a raw JSON log directly from ModSecurity / OWASP CRS.
    Normalizes the log and publishes it to the Event Bus for platform-wide consumption.
    """
    return await manager.ingest_modsec_log(raw_log)
