from pydantic import BaseModel
from typing import List, Optional

class ReportRequest(BaseModel):
    incident_id: str
    include_evidence: bool = True
    include_ai_analysis: bool = True

class ReportResponse(BaseModel):
    report_id: str
    incident_id: str
    format: str
    download_url: str
