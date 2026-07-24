import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from .schemas import ReportRequest, ReportResponse
from .services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    req: ReportRequest,
    format: str = "pdf",
    db: AsyncSession = Depends(get_db)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/download/{report_id}")
async def download_report(report_id: str):
    file_path = os.path.join(report_service.reports_dir, report_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")
        
    media_type = "application/pdf" if report_id.endswith(".pdf") else "text/html"
    return FileResponse(file_path, media_type=media_type, filename=report_id)
