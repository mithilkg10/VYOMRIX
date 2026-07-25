from fastapi import APIRouter, Depends, HTTPException, status
from .schemas import AlertListResponse, AgentListResponse
from .services import WazuhClient, WazuhIntegrationUnavailable, WazuhUpstreamError

router = APIRouter(prefix="/siem", tags=["SIEM"])

def get_wazuh_client() -> WazuhClient:
    return WazuhClient()

@router.get("/alerts", response_model=AlertListResponse)
async def get_alerts(limit: int = 50, client: WazuhClient = Depends(get_wazuh_client)):
    """Retrieve normalized alerts from the SIEM."""
    try:
        alerts = await client.get_alerts(limit=limit)
    except WazuhIntegrationUnavailable as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Wazuh alert integration is unavailable.") from error
    except WazuhUpstreamError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Wazuh alert integration returned invalid data.") from error
    return AlertListResponse(total=len(alerts), items=alerts)

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(client: WazuhClient = Depends(get_wazuh_client)):
    """Retrieve all SIEM agents and their status."""
    try:
        agents = await client.get_agents()
    except WazuhIntegrationUnavailable as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Wazuh agent integration is unavailable.") from error
    except WazuhUpstreamError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Wazuh agent integration returned invalid data.") from error
    return AgentListResponse(total=len(agents), items=agents)
