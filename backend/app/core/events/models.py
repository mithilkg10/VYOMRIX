import enum
from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base, VariantJSON

class EventStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(VariantJSON, nullable=False)
    source_module = Column(String(100), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)

class InboxEvent(Base):
    __tablename__ = "inbox_events"

    id = Column(String(36), primary_key=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(VariantJSON, nullable=False)
    source_module = Column(String(100), nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
