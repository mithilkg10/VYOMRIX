from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Generic Alert Model ---
class AlertSource(BaseModel):
    name: str  # e.g., "Wazuh", "OpenCanary", "SafeLine"
    ip: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None

class MITREInfo(BaseModel):
    id: List[str] = []
    tactic: List[str] = []
    technique: List[str] = []

class NormalizedAlert(BaseModel):
    id: str
    timestamp: datetime
    title: str
    description: Optional[str] = None
    severity: int = Field(ge=0, le=15, description="Normalized severity 0-15")
    source: AlertSource
    rule_id: str
    mitre: Optional[MITREInfo] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict, description="Original raw event")
    tags: List[str] = []

class AlertListResponse(BaseModel):
    total: int
    items: List[NormalizedAlert]

# --- Generic Agent Model ---
class AgentInfo(BaseModel):
    id: str
    name: str
    ip: Optional[str] = None
    os_name: Optional[str] = None
    os_version: Optional[str] = None
    status: str  # e.g., "active", "disconnected", "never_connected"
    last_keepalive: Optional[datetime] = None
    version: Optional[str] = None

class AgentListResponse(BaseModel):
    total: int
    items: List[AgentInfo]
