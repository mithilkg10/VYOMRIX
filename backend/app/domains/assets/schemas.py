from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

class AssetType(str, Enum):
    SERVER = "Server"
    WORKSTATION = "Workstation"
    VM = "VM"
    CONTAINER = "Container"
    WEB_APP = "Web App"
    HONEYPOT = "Honeypot"

class Environment(str, Enum):
    PRODUCTION = "Production"
    STAGING = "Staging"
    DEVELOPMENT = "Development"

class Criticality(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class HealthStatus(str, Enum):
    HEALTHY = "Healthy"
    WARNING = "Warning"
    OFFLINE = "Offline"
    COMPROMISED = "Compromised"

class Asset(BaseModel):
    id: str
    hostname: str
    ip_address: str
    os_name: Optional[str] = None
    asset_type: AssetType
    environment: Environment
    criticality: Criticality
    owner: str
    tags: List[str] = []
    
    # Coverage / Capabilities
    has_wazuh_agent: bool = False
    protected_by_waf: bool = False
    is_internet_facing: bool = False
    
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    health_status: HealthStatus = HealthStatus.HEALTHY
