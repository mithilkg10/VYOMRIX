from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from datetime import datetime, timezone
from app.core.database import Base
from .schemas import RuleStatus, RuleSeverity

class SigmaRuleModel(Base):
    __tablename__ = "sigma_rules"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    
    logsource = Column(JSONB, default={})
    detection_logic = Column(JSONB, default={})  # 'detection' is a reserved word/awkward sometimes, mapping to detection_logic
    falsepositives = Column(ARRAY(String), default=[])
    
    level = Column(SQLEnum(RuleSeverity, name="rule_severity_enum"), nullable=False)
    status = Column(SQLEnum(RuleStatus, name="rule_status_enum"), default=RuleStatus.TESTING)
    
    tags = Column(ARRAY(String), default=[])
    author = Column(String, nullable=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    raw_yaml = Column(Text, nullable=False)
