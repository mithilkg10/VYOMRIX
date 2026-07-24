from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
from app.core.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    
    # We store roles directly as an array of strings to keep it simple,
    # or we can just store a single role. The prompt asked for:
    # "Roles: Super Admin, Security Administrator, SOC Manager, SOC Analyst, Threat Hunter, Incident Responder, Read-Only Auditor"
    # And permissions scale better. We will store role and permissions.
    role = Column(String, nullable=False)
    permissions = Column(ARRAY(String), default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
