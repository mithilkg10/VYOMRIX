from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from .models import IncidentModel

class IncidentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[IncidentModel]:
        result = await self.db.execute(
            select(IncidentModel).options(
                selectinload(IncidentModel.timeline),
                selectinload(IncidentModel.evidence)
            ).order_by(IncidentModel.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, incident_id: str) -> Optional[IncidentModel]:
        result = await self.db.execute(
            select(IncidentModel).where(IncidentModel.id == incident_id).options(
                selectinload(IncidentModel.timeline),
                selectinload(IncidentModel.evidence)
            )
        )
        return result.scalars().first()

    async def create(self, incident: IncidentModel) -> IncidentModel:
        self.db.add(incident)
        await self.db.commit()
        await self.db.refresh(incident)
        # Re-fetch to load relationships if needed
        return await self.get_by_id(incident.id)

    async def update(self, incident: IncidentModel) -> IncidentModel:
        await self.db.commit()
        await self.db.refresh(incident)
        return incident

    async def delete(self, incident_id: str) -> bool:
        incident = await self.get_by_id(incident_id)
        if incident:
            await self.db.delete(incident)
            await self.db.commit()
            return True
        return False
