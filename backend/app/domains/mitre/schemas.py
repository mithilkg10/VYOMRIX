from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class Tactic(str, Enum):
    INITIAL_ACCESS = "Initial Access"
    EXECUTION = "Execution"
    PERSISTENCE = "Persistence"
    PRIVILEGE_ESCALATION = "Privilege Escalation"
    DEFENSE_EVASION = "Defense Evasion"
    CREDENTIAL_ACCESS = "Credential Access"
    DISCOVERY = "Discovery"
    LATERAL_MOVEMENT = "Lateral Movement"
    COLLECTION = "Collection"
    COMMAND_AND_CONTROL = "Command and Control"
    EXFILTRATION = "Exfiltration"
    IMPACT = "Impact"

class CoverageLevel(str, Enum):
    NONE = "None"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Technique(BaseModel):
    id: str  # e.g., T1059
    name: str
    description: str
    tactics: List[Tactic]
    data_sources: List[str] = []
    mitigations: List[str] = []
    
    # Coverage mapping
    coverage: CoverageLevel = CoverageLevel.NONE
    linked_sigma_rules: List[str] = []
    linked_wazuh_rules: List[str] = []
    
class TacticCoverage(BaseModel):
    tactic: Tactic
    total_techniques: int
    covered_techniques: int
    coverage_percentage: float
