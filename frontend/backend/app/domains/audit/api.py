import csv
import io
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import AuditLogResponse
from .services import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Logging"])


@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = Query(default=100, le=1000),
    skip: int = Query(default=0, ge=0),
    user_email: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.AUDIT_READ])),
):
    """Retrieve audit log entries with optional filtering and pagination."""
    return await audit_service.get_logs(
        db, limit=limit, skip=skip, user_email=user_email, action=action
    )


@router.get("/export/csv")
async def export_audit_logs_csv(
    limit: int = Query(default=1000, le=10000),
    user_email: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.AUDIT_READ])),
):
    """Export audit logs as CSV for compliance reporting."""
    logs = await audit_service.get_logs(
        db, limit=limit, skip=0, user_email=user_email, action=action
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "Action", "Target", "Resource ID", "IP Address", "Result"])
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat() if log.timestamp else "",
            log.user_email,
            log.action,
            log.target,
            log.resource_id or "",
            log.ip_address or "",
            log.result,
        ])

    output.seek(0)
    filename = f"vyomrix_audit_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
