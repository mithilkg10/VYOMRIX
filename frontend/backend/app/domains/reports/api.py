import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_user, RequirePermissions
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum
from .schemas import ReportRequest, ReportResponse
from .services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    req: ReportRequest,
    format: str = "pdf",
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.REPORTS_READ]))
):
    try:
        if format.lower() == "html":
            file_path = await report_service.generate_html_report(db, req.incident_id)
        elif format.lower() == "pdf":
            file_path = await report_service.generate_pdf_report(db, req.incident_id)
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'html' or 'pdf'.")

        return ReportResponse(
            report_id=os.path.basename(file_path),
            incident_id=req.incident_id,
            format=format,
            download_url=f"/api/v1/reports/download/{os.path.basename(file_path)}"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Report generation could not be completed.")

@router.get("/download/{report_id}")
async def download_report(
    report_id: str,
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.REPORTS_READ]))
):
    # Prevent path traversal: basename must equal the report_id itself
    safe_id = os.path.basename(report_id)
    if safe_id != report_id or ".." in report_id:
        raise HTTPException(status_code=400, detail="Invalid report ID.")

    file_path = os.path.join(report_service.storage.reports_dir, safe_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")

    media_type = "application/pdf" if safe_id.endswith(".pdf") else "text/html"
    return FileResponse(file_path, media_type=media_type, filename=safe_id)
