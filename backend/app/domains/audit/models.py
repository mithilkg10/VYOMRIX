from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.core.database import Base

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_email = Column(String, index=True)
    action = Column(String, index=True) # e.g., "login", "incident:update", "rule:create"
    target = Column(String) # e.g., "incident", "sigma_rule"
    resource_id = Column(String, nullable=True) # e.g., "INC-2026-001"
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    result = Column(String) # "success" or "failure"
