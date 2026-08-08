import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.events.bus import Event, EventType, event_bus
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .models import EvidenceModel, TimelineEventModel
from .repository import IncidentRepository
from .schemas import (
    Incident,
    IncidentSeverity,
    IncidentStatus,
    PaginatedIncidentResponse,
)
from .services import IncidentManager

router = APIRouter(prefix="/incidents", tags=["Incident Response"])


def get_incident_manager(db: AsyncSession = Depends(get_db)) -> IncidentManager:
    return IncidentManager(repository=IncidentRepository(db))


# ── Request bodies ──────────────────────────────────────────────────────────────

class IncidentCreateRequest(BaseModel):
    title: str
    description: str
    severity: IncidentSeverity
    related_assets: List[str] = []
    related_mitre_tactics: List[str] = []
    playbook_id: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: IncidentStatus


class SeverityUpdateRequest(BaseModel):
    severity: IncidentSeverity


class AssignRequest(BaseModel):
    analyst_email: str


class TimelineEntryRequest(BaseModel):
    source: str
    description: str
    raw_data: Optional[dict] = None


class EvidenceRequest(BaseModel):
    name: str
    type: str
    url: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────────────────────

async def _publish_update(incident: Incident, event_type: EventType) -> None:
    try:
        await event_bus.publish(Event(
            event_type=event_type,
            source_module="incidents",
            payload=incident.model_dump(mode="json"),
            event_id=str(uuid.uuid4()),
        ))
    except Exception:
        pass  # Event publish failure must never abort the API response


# ── Endpoints ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=PaginatedIncidentResponse)
async def list_incidents(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    manager: IncidentManager = Depends(get_incident_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_READ])),
):
    """List all security incidents with pagination and filtering."""
    return await manager.get_all_incidents(skip=skip, limit=limit, status=status, severity=severity)


@router.post("/", response_model=Incident, status_code=status.HTTP_201_CREATED)
async def create_incident(
    req: IncidentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_WRITE])),
):
    """Create a new security incident."""
    from .models import IncidentModel
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"

    model = IncidentModel(
        id=incident_id,
        title=req.title,
        description=req.description,
        severity=req.severity,
        status=IncidentStatus.OPEN,
        created_at=now,
        updated_at=now,
        related_assets=req.related_assets,
        related_mitre_tactics=req.related_mitre_tactics,
        playbook_id=req.playbook_id,
        timeline=[
            TimelineEventModel(
                id=str(uuid.uuid4()),
                incident_id=incident_id,
                timestamp=now,
                source=current_user.email,
                description="Incident created.",
            )
        ],
    )
    repo = IncidentRepository(db)
    saved = await repo.create(model)
    result = Incident.model_validate(saved, from_attributes=True)
    await _publish_update(result, EventType.INCIDENT_CREATED)
    return result


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(
    incident_id: str,
    manager: IncidentManager = Depends(get_incident_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_READ])),
):
    """Retrieve details for a specific incident."""
    inc = await manager.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.put("/{incident_id}/status", response_model=Incident)
async def update_incident_status(
    incident_id: str,
    body: StatusUpdateRequest,
    manager: IncidentManager = Depends(get_incident_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_WRITE])),
):
    """Update the status of an incident."""
    inc = await manager.update_status(incident_id, body.status)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    await _publish_update(inc, EventType.INCIDENT_UPDATED)
    return inc


@router.put("/{incident_id}/severity", response_model=Incident)
async def update_incident_severity(
    incident_id: str,
    body: SeverityUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_WRITE])),
):
    """Escalate or de-escalate incident severity."""
    repo = IncidentRepository(db)
    model = await repo.get_by_id(incident_id)
    if not model:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    old_severity = model.severity
    model.severity = body.severity
    model.updated_at = now
    model.timeline.append(TimelineEventModel(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        timestamp=now,
        source=current_user.email,
        description=f"Severity changed from {old_severity} to {body.severity.value}.",
    ))
    saved = await repo.update(model)
    result = Incident.model_validate(saved, from_attributes=True)
    await _publish_update(result, EventType.INCIDENT_UPDATED)
    return result


@router.put("/{incident_id}/assign", response_model=Incident)
async def assign_incident(
    incident_id: str,
    body: AssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_ASSIGN])),
):
    """Assign an analyst to an incident."""
    repo = IncidentRepository(db)
    model = await repo.get_by_id(incident_id)
    if not model:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    model.assigned_analyst = body.analyst_email
    model.updated_at = now
    model.timeline.append(TimelineEventModel(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        timestamp=now,
        source=current_user.email,
        description=f"Assigned to {body.analyst_email}.",
    ))
    saved = await repo.update(model)
    result = Incident.model_validate(saved, from_attributes=True)
    await _publish_update(result, EventType.INCIDENT_UPDATED)
    return result


@router.post("/{incident_id}/timeline", response_model=Incident)
async def add_timeline_entry(
    incident_id: str,
    body: TimelineEntryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_WRITE])),
):
    """Add a manual timeline entry to an incident."""
    repo = IncidentRepository(db)
    model = await repo.get_by_id(incident_id)
    if not model:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    model.timeline.append(TimelineEventModel(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        timestamp=now,
        source=body.source or current_user.email,
        description=body.description,
        raw_data=body.raw_data,
    ))
    model.updated_at = now
    saved = await repo.update(model)
    result = Incident.model_validate(saved, from_attributes=True)
    await _publish_update(result, EventType.INCIDENT_UPDATED)
    return result


@router.post("/{incident_id}/evidence", response_model=Incident)
async def add_evidence(
    incident_id: str,
    body: EvidenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_WRITE])),
):
    """Attach evidence to an incident."""
    repo = IncidentRepository(db)
    model = await repo.get_by_id(incident_id)
    if not model:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    model.evidence.append(EvidenceModel(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        name=body.name,
        type=body.type,
        url=body.url,
        uploaded_at=now,
    ))
    model.updated_at = now
    model.timeline.append(TimelineEventModel(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        timestamp=now,
        source=current_user.email,
        description=f"Evidence attached: {body.name} ({body.type}).",
    ))
    saved = await repo.update(model)
    result = Incident.model_validate(saved, from_attributes=True)
    await _publish_update(result, EventType.INCIDENT_UPDATED)
    return result


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_DELETE])),
):
    """Delete an incident (requires INCIDENTS_DELETE permission)."""
    repo = IncidentRepository(db)
    deleted = await repo.delete(incident_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Incident not found")


# ── SSE stream ──────────────────────────────────────────────────────────────────

@router.get("/stream/updates")
async def stream_incident_updates(
    request: Request,
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.INCIDENTS_READ])),
):
    """Real-time SSE stream for incident create/update events."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)

    async def event_handler(event: Event) -> None:
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            pass

    event_bus.subscribe(EventType.INCIDENT_CREATED, event_handler)
    event_bus.subscribe(EventType.INCIDENT_UPDATED, event_handler)

    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event: Event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: {event.event_type.value}\ndata: {event.model_dump_json()}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            event_bus.unsubscribe(EventType.INCIDENT_CREATED, event_handler)
            event_bus.unsubscribe(EventType.INCIDENT_UPDATED, event_handler)

    return StreamingResponse(generator(), media_type="text/event-stream")
