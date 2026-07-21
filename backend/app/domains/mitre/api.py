from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .schemas import Technique, TacticCoverage
from .services import MitreManager

router = APIRouter(prefix="/mitre", tags=["MITRE ATT&CK Platform"])

_manager = MitreManager()

def get_mitre_manager() -> MitreManager:
    return _manager

@router.get("/techniques", response_model=List[Technique])
async def list_techniques(manager: MitreManager = Depends(get_mitre_manager)):
    """List all mapped ATT&CK techniques in the knowledge base."""
    return await manager.get_all_techniques()

@router.get("/techniques/{technique_id}", response_model=Technique)
async def get_technique(technique_id: str, manager: MitreManager = Depends(get_mitre_manager)):
    """Get details for a specific technique including coverage."""
    tech = await manager.get_technique(technique_id)
    if not tech:
        raise HTTPException(status_code=404, detail="Technique not found")
    return tech

@router.get("/coverage", response_model=List[TacticCoverage])
async def get_coverage(manager: MitreManager = Depends(get_mitre_manager)):
    """Calculate defensive coverage across all tactics."""
    return await manager.calculate_coverage()

@router.get("/gaps", response_model=List[Technique])
async def get_gaps(manager: MitreManager = Depends(get_mitre_manager)):
    """Identify techniques with NO detection coverage."""
    return await manager.get_gap_analysis()
