from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import Incident, IncidentStatus, IncidentSeverity, PaginatedIncidentResponse
from .services import IncidentManager
from .repository import IncidentRepository

router = APIRouter(prefix="/incidents", tags=["Incident Response"])

def get_incident_manager(db: AsyncSession = Depends(get_db)) -> IncidentManager:
    repo = IncidentRepository(db)
    return IncidentManager(repository=repo)

@router.get("/", response_model=PaginatedIncidentResponse)
async def list_incidents(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    manager: IncidentManager = Depends(get_incident_manager)
):
    """List all security incidents with pagination and filtering."""
    return await manager.get_all_incidents(skip=skip, limit=limit, status=status, severity=severity)

@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str, manager: IncidentManager = Depends(get_incident_manager)):
    """Retrieve details for a specific incident."""
    inc = await manager.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.put("/{incident_id}/status", response_model=Incident)
async def update_incident_status(
    incident_id: str, 
    status: IncidentStatus, 
    manager: IncidentManager = Depends(get_incident_manager)
):
    """Update the status of an incident (e.g. In Progress -> Contained)."""
    inc = await manager.update_status(incident_id, status)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

import asyncio
from fastapi.responses import StreamingResponse
from app.core.events.bus import event_bus, EventType, Event

@router.get("/stream/updates")
async def stream_incident_updates(request: Request):
    """Real-time Server-Sent Events (SSE) for incident updates."""
    queue = asyncio.Queue()
    
    async def event_handler(event: Event):
        await queue.put(event)
        
    # Subscribe to relevant events
    event_bus.subscribe(EventType.INCIDENT_CREATED, event_handler)
    event_bus.subscribe(EventType.INCIDENT_UPDATED, event_handler)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event: Event = await asyncio.wait_for(queue.get(), timeout=2.0)
                    yield f"event: {event.event_type.value}\ndata: {event.model_dump_json()}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield ": keepalive\n\n"
        finally:
            event_bus.unsubscribe(EventType.INCIDENT_CREATED, event_handler)
            event_bus.unsubscribe(EventType.INCIDENT_UPDATED, event_handler)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
