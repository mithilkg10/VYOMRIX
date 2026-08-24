from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

class WAFEventType(str, Enum):
    SQL_INJECTION = "SQLInjectionDetected"
    XSS = "XSSDetected"
    PATH_TRAVERSAL = "PathTraversalDetected"
    COMMAND_INJECTION = "CommandInjectionDetected"
    FILE_UPLOAD_ATTACK = "FileUploadAttackDetected"
    RATE_LIMIT_EXCEEDED = "RateLimitExceeded"
    BOT_DETECTED = "BotDetected"
    UNKNOWN = "UnknownWAFEvent"

class WAFEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: WAFEventType
    src_ip: str
    http_method: str
    http_uri: str
    user_agent: str
    rule_id: str
    rule_message: str
    action_taken: str  # e.g., "blocked", "logged"
    
    # Enrichment
    threat_score: Optional[int] = None
    threat_tags: list[str] = []
