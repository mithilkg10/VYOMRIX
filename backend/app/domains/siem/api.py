from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import AlertListResponse, AgentListResponse
from .services import WazuhClient, WazuhIntegrationUnavailable, WazuhUpstreamError

router = APIRouter(prefix="/siem", tags=["SIEM"])


def get_wazuh_client() -> WazuhClient:
    return WazuhClient()


@router.get("/alerts", response_model=AlertListResponse)
async def get_alerts(
    limit: int = Query(default=50, le=500),
    client: WazuhClient = Depends(get_wazuh_client),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.SIEM_READ])),
):
    """Retrieve normalized security alerts from the SIEM (Wazuh indexer)."""
    try:
        alerts = await client.get_alerts(limit=limit)
    except WazuhIntegrationUnavailable as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SIEM alert integration is unavailable.",
        ) from error
    except WazuhUpstreamError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SIEM returned an invalid response.",
        ) from error
    return AlertListResponse(total=len(alerts), items=alerts)


@router.get("/agents", response_model=AgentListResponse)
async def get_agents(
    client: WazuhClient = Depends(get_wazuh_client),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.SIEM_READ])),
):
    """Retrieve all registered SIEM agents and their status."""
    try:
        agents = await client.get_agents()
    except WazuhIntegrationUnavailable as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SIEM agent integration is unavailable.",
        ) from error
    except WazuhUpstreamError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SIEM returned an invalid response.",
        ) from error
    return AgentListResponse(total=len(agents), items=agents)
