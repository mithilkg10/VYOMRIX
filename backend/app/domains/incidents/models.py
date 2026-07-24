from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from .schemas import IncidentStatus, IncidentSeverity

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    
    severity = Column(SQLEnum(IncidentSeverity, name="incident_severity_enum"), nullable=False)
    status = Column(SQLEnum(IncidentStatus, name="incident_status_enum"), default=IncidentStatus.OPEN)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    assigned_analyst = Column(String, nullable=True)
    related_assets = Column(ARRAY(String), default=[])
    related_mitre_tactics = Column(ARRAY(String), default=[])
    
    playbook_id = Column(String, nullable=True)
    ai_summary = Column(String, nullable=True)
    
    timeline = relationship("TimelineEventModel", back_populates="incident", cascade="all, delete")
    evidence = relationship("EvidenceModel", back_populates="incident", cascade="all, delete")

class TimelineEventModel(Base):
    __tablename__ = "incident_timeline_events"
    
    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String)
    description = Column(String)
    raw_data = Column(JSONB, nullable=True)
    
    incident = relationship("IncidentModel", back_populates="timeline")

class EvidenceModel(Base):
    __tablename__ = "incident_evidence"
    
    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    incident = relationship("IncidentModel", back_populates="evidence")
