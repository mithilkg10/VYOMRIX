from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from .models import IncidentModel

class IncidentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> List[IncidentModel]:
        stmt = select(IncidentModel)
        if status:
            stmt = stmt.where(IncidentModel.status == status)
        if severity:
            stmt = stmt.where(IncidentModel.severity == severity)
            
        result = await self.db.execute(
            stmt.options(
                selectinload(IncidentModel.timeline),
                selectinload(IncidentModel.evidence)
            ).order_by(IncidentModel.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
        
    async def count(self, status: Optional[str] = None, severity: Optional[str] = None) -> int:
        from sqlalchemy import func
        stmt = select(func.count(IncidentModel.id))
        if status:
            stmt = stmt.where(IncidentModel.status == status)
        if severity:
            stmt = stmt.where(IncidentModel.severity == severity)
        result = await self.db.execute(stmt)
        return result.scalar() or 0

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
