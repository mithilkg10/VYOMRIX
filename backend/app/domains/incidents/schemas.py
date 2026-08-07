from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone
from enum import Enum

class IncidentStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CONTAINED = "Contained"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class IncidentSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    source: str # e.g., "WAF", "Wazuh", "AI", "Analyst"
    description: str
    raw_data: Optional[Any] = None

class Evidence(BaseModel):
    id: str
    name: str
    type: str # e.g., "PCAP", "Log", "Screenshot"
    url: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class Playbook(BaseModel):
    id: str
    name: str
    description: str
    steps: List[str]

class Incident(BaseModel):
    id: str
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus = IncidentStatus.OPEN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    closed_at: Optional[datetime] = None
    
    assigned_analyst: Optional[str] = None
    related_assets: List[str] = []
    related_mitre_tactics: List[str] = []
    
    timeline: List[TimelineEvent] = []
    evidence: List[Evidence] = []
    playbook_id: Optional[str] = None
    
    ai_summary: Optional[str] = None

class PaginatedIncidentResponse(BaseModel):
    items: List[Incident]
    total: int
    skip: int
    limit: int
