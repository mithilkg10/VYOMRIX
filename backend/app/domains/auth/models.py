from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime, timezone
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
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    reset_token_hash = Column(String, nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)


class RefreshSessionModel(Base):
    __tablename__ = "refresh_sessions"

    id = Column(String, primary_key=True, index=True) # Session ID
    user_id = Column(String, index=True, nullable=False) # FK to users (not strictly enforced for flexibility, or we can use ForeignKey)
    jti = Column(String, unique=True, index=True, nullable=False) # Current Token JTI (hashed)
    family_id = Column(String, index=True, nullable=False) # Token family ID
    parent_jti = Column(String, nullable=True) # Previous token identifier
    replacement_jti = Column(String, nullable=True) # Token that replaced this one
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    last_used_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    expires_at = Column(DateTime, index=True, nullable=False)
    rotated_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, index=True, nullable=True)
    revocation_reason = Column(String, nullable=True)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device_name = Column(String, nullable=True)
    
    replay_detected_at = Column(DateTime, nullable=True)
