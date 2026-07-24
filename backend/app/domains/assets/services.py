from typing import List, Optional
from .schemas import Asset
from .repository import AssetRepository

class AssetManager:
    def __init__(self, repository: AssetRepository):
        self.repository = repository
        
    async def get_all_assets(self) -> List[Asset]:
        models = await self.repository.get_all()
        # Convert models to schemas
        return [Asset.model_validate(model, from_attributes=True) for model in models]
        
    async def get_asset_by_ip(self, ip_address: str) -> Optional[Asset]:
        model = await self.repository.get_by_ip(ip_address)
        if model:
            return Asset.model_validate(model, from_attributes=True)
        return None
        
    async def get_asset(self, asset_id: str) -> Optional[Asset]:
        model = await self.repository.get_by_id(asset_id)
        if model:
            return Asset.model_validate(model, from_attributes=True)
        return None
        
    # Mock fallback, in the future this should save to repo
    # But for v1, the endpoints only need get.
