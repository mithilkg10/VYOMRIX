import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
            result=log_in.result,
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        return db_log

    async def get_logs(
        self,
        db: AsyncSession,
        limit: int = 100,
        skip: int = 0,
        user_email: Optional[str] = None,
        action: Optional[str] = None,
    ) -> List[AuditLogModel]:
        stmt = select(AuditLogModel)
        if user_email:
            stmt = stmt.where(AuditLogModel.user_email == user_email)
        if action:
            stmt = stmt.where(AuditLogModel.action.contains(action))
        stmt = stmt.order_by(AuditLogModel.timestamp.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())


audit_service = AuditService()
