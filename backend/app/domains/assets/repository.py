from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import NoResultFound
from .models import AssetModel
from .schemas import Asset

class AssetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[AssetModel]:
        result = await self.db.execute(select(AssetModel))
        return list(result.scalars().all())

    async def get_by_id(self, asset_id: str) -> Optional[AssetModel]:
        result = await self.db.execute(select(AssetModel).where(AssetModel.id == asset_id))
        return result.scalars().first()

    async def get_by_ip(self, ip_address: str) -> Optional[AssetModel]:
        result = await self.db.execute(select(AssetModel).where(AssetModel.ip_address == ip_address))
        return result.scalars().first()

    async def create(self, asset: AssetModel) -> AssetModel:
        self.db.add(asset)
        await self.db.commit()
        await self.db.refresh(asset)
        return asset

    async def delete(self, asset_id: str) -> bool:
        asset = await self.get_by_id(asset_id)
        if asset:
            await self.db.delete(asset)
            await self.db.commit()
            return True
        return False
