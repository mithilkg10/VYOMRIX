from fastapi import APIRouter, Depends
from .schemas import AlertListResponse, AgentListResponse
from .services import WazuhClient

router = APIRouter(prefix="/siem", tags=["SIEM"])

def get_wazuh_client() -> WazuhClient:
    return WazuhClient()

@router.get("/alerts", response_model=AlertListResponse)
async def get_alerts(limit: int = 50, client: WazuhClient = Depends(get_wazuh_client)):
    """Retrieve normalized alerts from the SIEM."""
    alerts = await client.get_alerts(limit=limit)
    return AlertListResponse(total=len(alerts), items=alerts)

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(client: WazuhClient = Depends(get_wazuh_client)):
    """Retrieve all SIEM agents and their status."""
    agents = await client.get_agents()
    return AgentListResponse(total=len(agents), items=agents)
