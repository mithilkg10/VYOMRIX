import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import AuditLogModel
from .schemas import AuditLogCreate

class AuditService:
    async def create_log(self, db: AsyncSession, log_in: AuditLogCreate) -> AuditLogModel:
        db_log = AuditLogModel(
            id=f"AUD-{uuid.uuid4().hex[:8]}",
            user_email=log_in.user_email,
            action=log_in.action,
            target=log_in.target,
            resource_id=log_in.resource_id,
            ip_address=log_in.ip_address,
            user_agent=log_in.user_agent,
            result=log_in.result
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        return db_log

    async def get_logs(self, db: AsyncSession, limit: int = 100) -> List[AuditLogModel]:
        result = await db.execute(select(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(limit))
        return result.scalars().all()

audit_service = AuditService()
