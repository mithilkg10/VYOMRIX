from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import WAFEvent
from .services import WAFManager

router = APIRouter(prefix="/waf", tags=["Web Application Firewall"])


def get_waf_manager() -> WAFManager:
    return WAFManager()


@router.post("/ingest", response_model=WAFEvent)
async def ingest_log(
    raw_log: Dict[str, Any],
    manager: WAFManager = Depends(get_waf_manager),
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.WAF_CONFIGURE])),
):
    """
    Ingest a raw JSON log directly from ModSecurity / OWASP CRS.
    Normalizes the log and publishes it to the Event Bus for platform-wide consumption.
    Requires WAF_CONFIGURE permissions since it manipulates pipeline ingestion.
    """
    return await manager.ingest_modsec_log(raw_log, db)
