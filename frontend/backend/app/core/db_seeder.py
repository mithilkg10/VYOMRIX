import asyncio
import uuid

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.domains.assets.models import AssetModel
from app.domains.incidents.models import IncidentModel
from app.domains.mitre.models import TechniqueModel


async def seed_data():
    """Seed non-sensitive demonstration operational data."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AssetModel))
        if not result.scalars().first():
            from app.domains.assets.schemas import AssetType, Environment, Criticality

            assets = [
                AssetModel(id=f"AST-{uuid.uuid4().hex[:8]}", hostname="web-prod-01", ip_address="10.0.1.10", os_name="Ubuntu 22.04", asset_type=AssetType.SERVER, environment=Environment.PRODUCTION, criticality=Criticality.HIGH, owner="IT", tags=["prod", "web"]),
                AssetModel(id=f"AST-{uuid.uuid4().hex[:8]}", hostname="db-prod-01", ip_address="10.0.1.20", os_name="Ubuntu 20.04", asset_type=AssetType.SERVER, environment=Environment.PRODUCTION, criticality=Criticality.CRITICAL, owner="DBA", tags=["prod", "db"]),
                AssetModel(id=f"AST-{uuid.uuid4().hex[:8]}", hostname="workstation-ceo", ip_address="10.0.5.50", os_name="Windows 11", asset_type=AssetType.WORKSTATION, environment=Environment.PRODUCTION, criticality=Criticality.MEDIUM, owner="IT", tags=["workstation", "exec"]),
            ]
            session.add_all(assets)
            await session.commit()
            print("Successfully seeded Assets.")

        result = await session.execute(select(TechniqueModel))
        if not result.scalars().first():
            techniques = [
                TechniqueModel(id="T1078", name="Valid Accounts", tactics=["Initial Access"], description="Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access."),
                TechniqueModel(id="T1190", name="Exploit Public-Facing Application", tactics=["Initial Access"], description="Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program."),
            ]
            session.add_all(techniques)
            await session.commit()
            print("Successfully seeded MITRE Techniques.")

        result = await session.execute(select(IncidentModel))
        if not result.scalars().first():
            incidents = [
                IncidentModel(id=f"INC-{uuid.uuid4().hex[:8]}", title="Suspicious Login on DB Server", description="Multiple failed SSH logins followed by a successful login at 3 AM.", severity="High", status="Open"),
                IncidentModel(id=f"INC-{uuid.uuid4().hex[:8]}", title="WAF SQLi Attempt Blocked", description="SQL injection payload detected and blocked by WAF on web-prod-01.", severity="Medium", status="Resolved"),
                IncidentModel(id=f"INC-{uuid.uuid4().hex[:8]}", title="Honeypot Accessed", description="Unauthorized internal scan triggered the honeypot on the DB segment.", severity="Critical", status="Open"),
            ]
            session.add_all(incidents)
            await session.commit()
            print("Successfully seeded Incidents.")


if __name__ == "__main__":
    asyncio.run(seed_data())
