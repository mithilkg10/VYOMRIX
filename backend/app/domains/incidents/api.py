from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import Incident, IncidentStatus
from .services import IncidentManager
from .repository import IncidentRepository

router = APIRouter(prefix="/incidents", tags=["Incident Response"])

def get_incident_manager(db: AsyncSession = Depends(get_db)) -> IncidentManager:
    repo = IncidentRepository(db)
    return IncidentManager(repository=repo)

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
