from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AgentRole(str, Enum):
    SOC_ANALYST = "soc_analyst"
    THREAT_INTEL_ANALYST = "threat_intel_analyst"
    DETECTION_ENGINEER = "detection_engineer"
    IR_ADVISOR = "ir_advisor"
    SECURITY_ASSISTANT = "security_assistant"

class AIResponseModel(BaseModel):
    summary: str
    risk_level: str
    confidence: int = Field(ge=0, le=100)
    mitre_attack: List[str] = []
    indicators: List[str] = []
    threat_intelligence: Optional[str] = None
    root_cause: Optional[str] = None
    business_impact: Optional[str] = None
    recommended_actions: List[str] = []
    references: List[str] = []

class ChatRequest(BaseModel):
    message: str
    role: AgentRole = AgentRole.SECURITY_ASSISTANT
    context_data: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    id: str
    role: AgentRole
    response: AIResponseModel
    raw_text: str  # For cases where structured output fails
    processing_time_ms: int
