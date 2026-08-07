from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_user, RequirePermissions
from app.domains.auth.models import UserModel
from .schemas import AuditLogResponse
from .services import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Logging"])

from app.domains.auth.permissions import PermissionsEnum

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.AUDIT_READ]))
):
    return await audit_service.get_logs(db, limit=limit)
