from fastapi import APIRouter, Depends
from typing import Dict, Any
from .schemas import DeceptionEvent
from .services import DeceptionManager

router = APIRouter(prefix="/deception", tags=["Deception Platform"])

def get_deception_manager() -> DeceptionManager:
    return DeceptionManager()

@router.post("/ingest", response_model=DeceptionEvent)
async def ingest_log(
    raw_log: Dict[str, Any],
    manager: DeceptionManager = Depends(get_deception_manager)
):
    """
    Ingest a raw JSON log directly from OpenCanary.
    Normalizes the log and publishes it to the Event Bus for platform-wide consumption.
    """
    return await manager.ingest_opencanary_log(raw_log)
