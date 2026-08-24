from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_email: str
    action: str
    target: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    result: str = "success"

class AuditLogResponse(AuditLogCreate):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
