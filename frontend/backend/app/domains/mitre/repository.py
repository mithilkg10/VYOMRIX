from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import TechniqueModel

class MitreRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[TechniqueModel]:
        result = await self.db.execute(select(TechniqueModel))
        return list(result.scalars().all())

    async def get_by_id(self, technique_id: str) -> Optional[TechniqueModel]:
        result = await self.db.execute(select(TechniqueModel).where(TechniqueModel.id == technique_id))
        return result.scalars().first()

    async def create(self, technique: TechniqueModel) -> TechniqueModel:
        self.db.add(technique)
        await self.db.commit()
        await self.db.refresh(technique)
        return technique

    async def delete(self, technique_id: str) -> bool:
        technique = await self.get_by_id(technique_id)
        if technique:
            await self.db.delete(technique)
            await self.db.commit()
            return True
        return False
