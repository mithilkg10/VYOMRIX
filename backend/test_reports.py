import asyncio
from app.core.database import AsyncSessionLocal
from app.domains.incidents.models import IncidentModel
from sqlalchemy.future import select

async def main(): 
    async with AsyncSessionLocal() as db: 
        res = await db.execute(select(IncidentModel))
        incident = res.scalars().first()
        if incident:
            print(f"Testing incident {incident.id}")
            from app.domains.reports.services import report_service
            pdf = await report_service.generate_pdf_report(db, incident.id)
            html = await report_service.generate_html_report(db, incident.id)
            print(f"Generated PDF: {pdf}")
            print(f"Generated HTML: {html}")

asyncio.run(main())
