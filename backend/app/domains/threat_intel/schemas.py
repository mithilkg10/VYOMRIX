from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class IOCType(str, Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"
    CVE = "cve"

class RiskLevel(str, Enum):
    CLEAN = "clean"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

class ProviderResult(BaseModel):
    provider_name: str
    is_malicious: bool
    confidence: int = Field(ge=0, le=100, description="Confidence score 0-100")
    tags: List[str] = []
    raw_data: Dict[str, Any] = {}

class NormalizedIOC(BaseModel):
    ioc_value: str
    ioc_type: IOCType
    risk_level: RiskLevel = RiskLevel.UNKNOWN
    risk_score: int = Field(ge=0, le=100, description="Calculated aggregate risk score")
    
    # Aggregated Insights
    tags: List[str] = []
    related_cves: List[str] = []
    related_malware: List[str] = []
    
    # Per-provider breakdown
    providers: List[ProviderResult] = []

    # Optional detailed fields depending on IOCType
    country: Optional[str] = None
    asn: Optional[str] = None
    file_type: Optional[str] = None
    cvss_score: Optional[float] = None
    cwe: Optional[str] = None
