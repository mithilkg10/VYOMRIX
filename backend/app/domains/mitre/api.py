from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import Technique, TacticCoverage
from .services import MitreManager
from .repository import MitreRepository

router = APIRouter(prefix="/mitre", tags=["MITRE ATT&CK Platform"])


def get_mitre_manager(db: AsyncSession = Depends(get_db)) -> MitreManager:
    return MitreManager(repository=MitreRepository(db))


@router.get("/techniques", response_model=List[Technique])
async def list_techniques(
    manager: MitreManager = Depends(get_mitre_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.MITRE_READ])),
):
    """List all ATT&CK techniques in the knowledge base."""
    return await manager.get_all_techniques()


@router.get("/techniques/{technique_id}", response_model=Technique)
async def get_technique(
    technique_id: str,
    manager: MitreManager = Depends(get_mitre_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.MITRE_READ])),
):
    """Get details for a specific ATT&CK technique including coverage data."""
    tech = await manager.get_technique(technique_id)
    if not tech:
        raise HTTPException(status_code=404, detail="Technique not found")
    return tech


@router.get("/coverage", response_model=List[TacticCoverage])
async def get_coverage(
    manager: MitreManager = Depends(get_mitre_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.MITRE_READ])),
):
    """Calculate defensive coverage across all ATT&CK tactics."""
    return await manager.calculate_coverage()


@router.get("/gaps", response_model=List[Technique])
async def get_gaps(
    manager: MitreManager = Depends(get_mitre_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.MITRE_READ])),
):
    """Identify ATT&CK techniques with NO detection coverage (gap analysis)."""
    return await manager.get_gap_analysis()
