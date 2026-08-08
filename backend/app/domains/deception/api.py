from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import DeceptionEvent
from .services import DeceptionManager

router = APIRouter(prefix="/deception", tags=["Deception Platform"])


def get_deception_manager() -> DeceptionManager:
    return DeceptionManager()


@router.post("/ingest", response_model=DeceptionEvent)
async def ingest_log(
    raw_log: Dict[str, Any],
    manager: DeceptionManager = Depends(get_deception_manager),
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.DECEPTION_CONFIGURE])),
):
    """
    Ingest a raw JSON log directly from OpenCanary.
    Normalizes the log and publishes it to the Event Bus for platform-wide consumption.
    Requires DECEPTION_CONFIGURE permission.
    """
    return await manager.ingest_opencanary_log(raw_log, db)
