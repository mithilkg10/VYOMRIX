from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import Asset
from .services import AssetManager
from .repository import AssetRepository

router = APIRouter(prefix="/assets", tags=["Asset Intelligence"])

def get_asset_manager(db: AsyncSession = Depends(get_db)) -> AssetManager:
    repo = AssetRepository(db)
    return AssetManager(repository=repo)

@router.get("/", response_model=List[Asset])
async def list_assets(manager: AssetManager = Depends(get_asset_manager)):
    """List all tracked enterprise assets."""
    return await manager.get_all_assets()

@router.get("/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str, manager: AssetManager = Depends(get_asset_manager)):
    """Retrieve a specific asset by ID."""
    asset = await manager.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.get("/ip/{ip_address}", response_model=Asset)
async def get_asset_by_ip(ip_address: str, manager: AssetManager = Depends(get_asset_manager)):
    """Lookup an asset by IP address (used for correlation)."""
    asset = await manager.get_asset_by_ip(ip_address)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
