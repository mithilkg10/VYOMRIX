import uuid
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from .schemas import Incident, IncidentStatus, IncidentSeverity, TimelineEvent, Playbook
from app.core.events.bus import event_bus, Event, EventType

logger = logging.getLogger(__name__)

class IncidentManager:
    def __init__(self):
        self._incidents: Dict[str, Incident] = self._seed_incidents()
        self._playbooks: Dict[str, Playbook] = self._seed_playbooks()

    def _seed_incidents(self) -> Dict[str, Incident]:
        inc1 = Incident(
            id="INC-2026-001",
            title="Correlated Attack Campaign: Mirai Botnet -> SQL Injection",
            description="A coordinated attack targeting the honeypot and subsequently attempting SQL injection against the production web server.",
            severity=IncidentSeverity.CRITICAL,
            status=IncidentStatus.IN_PROGRESS,
            assigned_analyst="Alice",
            related_assets=["ast-1001", "ast-1002"],
            related_mitre_tactics=["Initial Access", "Credential Access"],
            timeline=[
                TimelineEvent(id="t1", timestamp=datetime.utcnow() - timedelta(minutes=15), source="Deception", description="SSH Brute Force detected on Honeypot from 185.15.22.1"),
                TimelineEvent(id="t2", timestamp=datetime.utcnow() - timedelta(minutes=14), source="Threat Intel", description="IP 185.15.22.1 flagged as known Mirai node"),
                TimelineEvent(id="t3", timestamp=datetime.utcnow() - timedelta(minutes=5), source="WAF", description="SQL Injection blocked on juiceshop (/login) from 185.15.22.1"),
                TimelineEvent(id="t4", timestamp=datetime.utcnow() - timedelta(minutes=1), source="AI Advisor", description="Generated incident summary tying honeypot activity to WAF attack.")
            ],
            playbook_id="pb-001",
            ai_summary="High-confidence attack. The attacker enumerated the honeypot before pivoting to target the application layer of the production server. The WAF successfully blocked the intrusion, but the IP should be blacklisted at the perimeter."
        )
        return {inc1.id: inc1}

    def _seed_playbooks(self) -> Dict[str, Playbook]:
        pb = Playbook(
            id="pb-001",
            name="External Intrusion & WAF Alert Triage",
            description="Standard operating procedure for handling correlated external attacks against web assets.",
            steps=[
                "Verify WAF blocked the payload successfully.",
                "Review SIEM logs for the same Source IP to ensure no endpoint bypass occurred.",
                "Block the Source IP on the edge firewall.",
                "Review web application logs for similar payloads from different IPs.",
                "Close incident if contained."
            ]
        )
        return {pb.id: pb}

    async def get_all_incidents(self) -> List[Incident]:
        return list(self._incidents.values())
        
    async def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self._incidents.get(incident_id)

    async def update_status(self, incident_id: str, status: IncidentStatus) -> Optional[Incident]:
        inc = self._incidents.get(incident_id)
        if inc:
            inc.status = status
            inc.updated_at = datetime.utcnow()
            if status == IncidentStatus.CLOSED:
                inc.closed_at = datetime.utcnow()
            
            # Add timeline event
            inc.timeline.append(TimelineEvent(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                source="System",
                description=f"Status updated to {status.value}"
            ))
        return inc

class CorrelationEngine:
    """
    Subscribes to EventBus. Group events by Source IP within a time window.
    (Simplified mock for demonstration).
    """
    def __init__(self, incident_manager: IncidentManager):
        self.incident_manager = incident_manager
        
    async def process_event(self, event: Event):
        # In a real system, this would maintain state (e.g. Redis) to group events
        # by src_ip within a 30m window, and dynamically create/update an Incident.
        logger.info(f"Correlation Engine evaluating event: {event.event_type}")
        pass
