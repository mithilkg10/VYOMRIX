from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .schemas import Incident, IncidentStatus
from .services import IncidentManager

router = APIRouter(prefix="/incidents", tags=["Incident Response"])

_manager = IncidentManager()

def get_incident_manager() -> IncidentManager:
    return _manager

@router.get("/", response_model=List[Incident])
async def list_incidents(manager: IncidentManager = Depends(get_incident_manager)):
    """List all security incidents."""
    return await manager.get_all_incidents()

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
