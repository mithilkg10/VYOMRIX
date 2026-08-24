import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .models import AssetModel
from .repository import AssetRepository
from .schemas import Asset, AssetType, Criticality, Environment, HealthStatus
from .services import AssetManager

router = APIRouter(prefix="/assets", tags=["Asset Intelligence"])


def get_asset_manager(db: AsyncSession = Depends(get_db)) -> AssetManager:
    return AssetManager(repository=AssetRepository(db))


# ── Request bodies ──────────────────────────────────────────────────────────────

class AssetCreateRequest(BaseModel):
    hostname: str
    ip_address: str
    os_name: Optional[str] = None
    asset_type: AssetType
    environment: Environment
    criticality: Criticality
    owner: str
    tags: List[str] = []
    has_wazuh_agent: bool = False
    protected_by_waf: bool = False
    is_internet_facing: bool = False


class AssetUpdateRequest(BaseModel):
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    os_name: Optional[str] = None
    asset_type: Optional[AssetType] = None
    environment: Optional[Environment] = None
    criticality: Optional[Criticality] = None
    owner: Optional[str] = None
    tags: Optional[List[str]] = None
    has_wazuh_agent: Optional[bool] = None
    protected_by_waf: Optional[bool] = None
    is_internet_facing: Optional[bool] = None
    health_status: Optional[HealthStatus] = None


# ── Endpoints ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[Asset])
async def list_assets(
    manager: AssetManager = Depends(get_asset_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_READ])),
):
    """List all tracked enterprise assets."""
    return await manager.get_all_assets()


@router.post("/", response_model=Asset, status_code=status.HTTP_201_CREATED)
async def create_asset(
    req: AssetCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_WRITE])),
):
    """Register a new asset in the inventory."""
    repo = AssetRepository(db)
    asset_id = f"AST-{uuid.uuid4().hex[:8].upper()}"
    model = AssetModel(
        id=asset_id,
        hostname=req.hostname,
        ip_address=req.ip_address,
        os_name=req.os_name,
        asset_type=req.asset_type,
        environment=req.environment,
        criticality=req.criticality,
        owner=req.owner,
        tags=req.tags,
        has_wazuh_agent=req.has_wazuh_agent,
        protected_by_waf=req.protected_by_waf,
        is_internet_facing=req.is_internet_facing,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return Asset.model_validate(model, from_attributes=True)


@router.get("/{asset_id}", response_model=Asset)
async def get_asset(
    asset_id: str,
    manager: AssetManager = Depends(get_asset_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_READ])),
):
    """Retrieve a specific asset by ID."""
    asset = await manager.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{asset_id}", response_model=Asset)
async def update_asset(
    asset_id: str,
    req: AssetUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_WRITE])),
):
    """Partially update an asset record."""
    repo = AssetRepository(db)
    model = await repo.get_by_id(asset_id)
    if not model:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(model, field, value)

    await db.commit()
    await db.refresh(model)
    return Asset.model_validate(model, from_attributes=True)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_DELETE])),
):
    """Remove an asset from the inventory."""
    repo = AssetRepository(db)
    model = await repo.get_by_id(asset_id)
    if not model:
        raise HTTPException(status_code=404, detail="Asset not found")
    await db.delete(model)
    await db.commit()


@router.get("/ip/{ip_address}", response_model=Asset)
async def get_asset_by_ip(
    ip_address: str,
    manager: AssetManager = Depends(get_asset_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.ASSETS_READ])),
):
    """Look up an asset by its IP address (used for alert correlation)."""
    asset = await manager.get_asset_by_ip(ip_address)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
