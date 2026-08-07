import uuid
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta
from .schemas import Incident, IncidentStatus, IncidentSeverity, TimelineEvent, Playbook
from .repository import IncidentRepository
from app.core.events.bus import event_bus, Event, EventType
from .models import TimelineEventModel

logger = logging.getLogger(__name__)

class IncidentManager:
    def __init__(self, repository: IncidentRepository):
        self.repository = repository
        self._playbooks = self._seed_playbooks() # Keep mock playbooks for now as there's no PlaybookModel

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
        models = await self.repository.get_all()
        return [Incident.model_validate(m, from_attributes=True) for m in models]
        
    async def get_incident(self, incident_id: str) -> Optional[Incident]:
        model = await self.repository.get_by_id(incident_id)
        if model:
            return Incident.model_validate(model, from_attributes=True)
        return None

    async def update_status(self, incident_id: str, status: IncidentStatus) -> Optional[Incident]:
        model = await self.repository.get_by_id(incident_id)
        if model:
            model.status = status
            model.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            if status == IncidentStatus.CLOSED:
                model.closed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            
            # Add timeline event
            model.timeline.append(TimelineEventModel(
                id=str(uuid.uuid4()),
                incident_id=incident_id,
                timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
                source="System",
                description=f"Status updated to {status.value}"
            ))
            model = await self.repository.update(model)
            return Incident.model_validate(model, from_attributes=True)
        return None

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
