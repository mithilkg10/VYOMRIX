import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.domains.auth.models import UserModel
from app.core.config import settings
logger = logging.getLogger(__name__)
from app.domains.auth.permissions import PermissionsEnum, RoleEnum
from app.domains.auth.services import AuthService, pwd_context

auth_service = AuthService()

async def bootstrap_system():
    """Provision only explicitly configured owner and read-only demo accounts."""
    async with AsyncSessionLocal() as session:
        if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD_HASH:
            if not pwd_context.identify(settings.ADMIN_PASSWORD_HASH):
                raise ValueError("ADMIN_PASSWORD_HASH must be a supported password hash")
            existing = await session.scalar(select(UserModel).where(UserModel.email == settings.ADMIN_EMAIL))
            if not existing:
                session.add(UserModel(
                    id=str(uuid.uuid4()), email=settings.ADMIN_EMAIL,
                    hashed_password=settings.ADMIN_PASSWORD_HASH,
                    full_name="System Administrator", is_active=True,
                    role=RoleEnum.SUPER_ADMIN.value,
                    permissions=[PermissionsEnum.ADMIN_ALL.value],
                ))
                await session.commit()
                logger.info("Configured owner account created.")
            elif existing.role != RoleEnum.SUPER_ADMIN.value:
                raise ValueError("ADMIN_EMAIL already belongs to a non-admin account")
            else:
                existing.hashed_password = settings.ADMIN_PASSWORD_HASH
                existing.permissions = [PermissionsEnum.ADMIN_ALL.value]
                existing.is_active = True
                await session.commit()
                logger.info("Configured owner account updated.")
        elif settings.ADMIN_EMAIL or settings.ADMIN_PASSWORD_HASH:
            raise ValueError("Set both ADMIN_EMAIL and ADMIN_PASSWORD_HASH")
        else:
            logger.warning("No owner account configured; set ADMIN_EMAIL and ADMIN_PASSWORD_HASH.")

        if settings.DEMO_PASSWORD:
            if not settings.DEMO_DATA_ONLY:
                raise ValueError("DEMO_DATA_ONLY=true is required before provisioning a demo account")
            auth_service.validate_password_complexity(settings.DEMO_PASSWORD)
            if settings.ADMIN_PASSWORD_HASH and auth_service.verify_password(settings.DEMO_PASSWORD, settings.ADMIN_PASSWORD_HASH):
                raise ValueError("Owner and demo passwords must differ")
            demo_email = "demo.analyst@mithilkg.dev"
            read_permissions = [
                PermissionsEnum.INCIDENTS_READ, PermissionsEnum.ASSETS_READ,
                PermissionsEnum.SIEM_READ, PermissionsEnum.RULES_READ,
                PermissionsEnum.THREAT_INTEL_READ, PermissionsEnum.MITRE_READ,
                PermissionsEnum.AI_SOC_READ, PermissionsEnum.WAF_READ,
                PermissionsEnum.DECEPTION_READ, PermissionsEnum.HUNTING_READ,
                PermissionsEnum.PHISHING_READ, PermissionsEnum.REPORTS_READ,
                PermissionsEnum.NOTIFICATIONS_READ,
            ]
            existing = await session.scalar(select(UserModel).where(UserModel.email == demo_email))
            if not existing:
                session.add(UserModel(
                    id=str(uuid.uuid4()), email=demo_email,
                    hashed_password=auth_service.get_password_hash(settings.DEMO_PASSWORD),
                    full_name="Recruiter SOC Demo", is_active=True,
                    role=RoleEnum.SOC_ANALYST.value,
                    permissions=[permission.value for permission in read_permissions],
                ))
                await session.commit()
                logger.info("Read-only analyst demo account created.")
            else:
                existing.hashed_password = auth_service.get_password_hash(settings.DEMO_PASSWORD)
                existing.role = RoleEnum.SOC_ANALYST.value
                existing.permissions = [permission.value for permission in read_permissions]
                existing.is_active = True
                await session.commit()
