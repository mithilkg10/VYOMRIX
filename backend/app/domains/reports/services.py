import os
import uuid
import tempfile
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.ext.asyncio import AsyncSession
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.domains.incidents.models import IncidentModel
from sqlalchemy.future import select

class ReportService:
    def __init__(self):
        self.reports_dir = os.path.join(tempfile.gettempdir(), "vyomrix_reports")
        os.makedirs(self.reports_dir, exist_ok=True)
        # Use a string template for jinja to keep it simple, normally you'd use a file
        self.jinja_env = Environment(autoescape=select_autoescape())

    async def _get_incident_data(self, db: AsyncSession, incident_id: str):
        result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
        incident = result.scalars().first()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        return incident

    async def generate_html_report(self, db: AsyncSession, incident_id: str) -> str:
        incident = await self._get_incident_data(db, incident_id)
        
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vyomrix Security Report - {{ incident.title }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                h1 { color: #0052cc; }
                .header { border-bottom: 2px solid #0052cc; padding-bottom: 10px; margin-bottom: 20px; }
                .section { margin-bottom: 30px; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Vyomrix Incident Report</h1>
                <p>Generated on: {{ date }}</p>
            </div>
            
            <div class="section">
                <h2>Executive Summary</h2>
                <p><span class="label">Incident ID:</span> {{ incident.id }}</p>
                <p><span class="label">Title:</span> {{ incident.title }}</p>
                <p><span class="label">Severity:</span> {{ incident.severity }}</p>
                <p><span class="label">Status:</span> {{ incident.status }}</p>
            </div>
            
            <div class="section">
                <h2>Details</h2>
                <p>{{ incident.description }}</p>
            </div>
            
            <div class="section">
                <h2>MITRE ATT&CK Mapping</h2>
                <p>Not fully populated in mock data.</p>
            </div>
            
            <div class="section">
                <h2>AI Analysis & Recommendations</h2>
                <p>AI recommendations have been applied to this incident.</p>
            </div>
        </body>
        </html>
        """
        
        template = self.jinja_env.from_string(template_str)
        html_content = template.render(
            incident=incident,
            date=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        
        file_id = f"report_{incident_id}_{uuid.uuid4().hex[:6]}.html"
        file_path = os.path.join(self.reports_dir, file_id)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        return file_path

    async def generate_pdf_report(self, db: AsyncSession, incident_id: str) -> str:
        incident = await self._get_incident_data(db, incident_id)
        
        file_id = f"report_{incident_id}_{uuid.uuid4().hex[:6]}.pdf"
        file_path = os.path.join(self.reports_dir, file_id)
        
        doc = SimpleDocTemplate(file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        story.append(Paragraph("Vyomrix Incident Report", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Exec Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Paragraph(f"<b>Incident ID:</b> {incident.id}", styles['Normal']))
        story.append(Paragraph(f"<b>Title:</b> {incident.title}", styles['Normal']))
        story.append(Paragraph(f"<b>Severity:</b> {incident.severity}", styles['Normal']))
        story.append(Paragraph(f"<b>Status:</b> {incident.status}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Details
        story.append(Paragraph("Details", styles['Heading2']))
        story.append(Paragraph(incident.description or "No description provided.", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # MITRE
        story.append(Paragraph("MITRE ATT&CK Mapping", styles['Heading2']))
        story.append(Paragraph("No direct mappings available in this summary.", styles['Normal']))
        story.append(Spacer(1, 12))

        doc.build(story)
        
        return file_path

report_service = ReportService()
