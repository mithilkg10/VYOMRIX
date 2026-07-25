from fastapi import APIRouter, Depends, HTTPException, Query
from .schemas import NormalizedIOC, IOCType
from .services import ThreatIntelEngine, ThreatIntelIntegrationUnavailable

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])

def get_ti_engine() -> ThreatIntelEngine:
    return ThreatIntelEngine()

@router.get("/lookup", response_model=NormalizedIOC)
async def lookup_ioc(
    ioc_value: str = Query(..., description="The value of the IOC to look up (e.g., 8.8.8.8)"),
    ioc_type: IOCType = Query(..., description="The type of IOC"),
    engine: ThreatIntelEngine = Depends(get_ti_engine)
):
    """
    Look up an Indicator of Compromise (IOC) across all configured Threat Intelligence providers.
    Normalizes the response and calculates a unified risk score.
    """
    try:
        return await engine.enrich_ioc(ioc_value, ioc_type)
    except ThreatIntelIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail="Threat intelligence integrations are not configured.") from exc
