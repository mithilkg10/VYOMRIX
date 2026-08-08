from fastapi import APIRouter, Depends, HTTPException
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum
from .schemas import PhishingCampaignConfig, PhishingCampaignStatus
from .services import PhishingService, PhishingServiceUnavailable

router = APIRouter(prefix="/phishing", tags=["Phishing Simulation"])

def get_phishing_service() -> PhishingService:
    return PhishingService()

@router.post("/campaigns", response_model=PhishingCampaignStatus)
async def create_campaign(
    config: PhishingCampaignConfig,
    service: PhishingService = Depends(get_phishing_service),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.PHISHING_CONFIGURE]))
):
    """Launch a new phishing simulation campaign."""
    try:
        return await service.launch_campaign(config)
    except PhishingServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail="Phishing infrastructure unavailable") from exc
