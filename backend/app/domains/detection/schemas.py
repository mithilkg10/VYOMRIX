from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RuleStatus(str, Enum):
    ACTIVE = "Active"
    TESTING = "Testing"
    DEPRECATED = "Deprecated"

class RuleSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class SigmaRule(BaseModel):
    id: str
    title: str
    description: str
    logsource: Dict[str, str]
    detection: Dict[str, Any]
    falsepositives: List[str] = []
    level: RuleSeverity
    status: RuleStatus = RuleStatus.TESTING
    tags: List[str] = []
    author: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    
    # Internal Metadata
    raw_yaml: str

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
