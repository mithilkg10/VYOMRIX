from fastapi import APIRouter, Depends, HTTPException
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum
from .schemas import HuntQueryRequest, HuntQueryResponse
from .services import HuntingService, HuntingServiceUnavailable

router = APIRouter(prefix="/hunting", tags=["Threat Hunting"])

def get_hunting_service() -> HuntingService:
    return HuntingService()

@router.post("/execute", response_model=HuntQueryResponse)
async def execute_hunt(
    request: HuntQueryRequest,
    service: HuntingService = Depends(get_hunting_service),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.HUNTING_EXECUTE]))
):
    """Execute a threat hunting query across enterprise assets."""
    try:
        return await service.execute_query(request)
    except HuntingServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail="Hunting infrastructure unavailable") from exc
