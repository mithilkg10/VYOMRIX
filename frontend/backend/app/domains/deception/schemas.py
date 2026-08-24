from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

class HoneypotService(str, Enum):
    SSH = "ssh"
    FTP = "ftp"
    HTTP = "http"
    SMB = "smb"
    MYSQL = "mysql"
    UNKNOWN = "unknown"

class DeceptionEvent(BaseModel):
    id: str
    timestamp: datetime
    service: HoneypotService
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    log_type: str  # e.g. "login attempt", "file access"
    payload: Dict[str, Any]
    
    # Enrichment Fields
    is_enriched: bool = False
    threat_score: Optional[int] = None
    threat_tags: list[str] = []
