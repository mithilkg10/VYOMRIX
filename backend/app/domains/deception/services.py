import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from .schemas import DeceptionEvent, HoneypotService
from app.core.events.bus import event_bus, Event, EventType

logger = logging.getLogger(__name__)

class DeceptionManager:
    def __init__(self):
        self.node_id = "vyomrix-honeypot-01"
        
    def _map_service(self, log_type: int) -> HoneypotService:
        # OpenCanary uses integer log types, e.g., 2000 for FTP, 4000 for SSH
        mapping = {
            2000: HoneypotService.FTP,
            3000: HoneypotService.HTTP,
            4000: HoneypotService.SSH,
            5000: HoneypotService.SMB,
            8000: HoneypotService.MYSQL
        }
        return mapping.get(log_type, HoneypotService.UNKNOWN)

    async def ingest_opencanary_log(self, raw_log: Dict[str, Any]) -> DeceptionEvent:
        """
        Parses a raw JSON log from OpenCanary and normalizes it.
        Publishes the normalized event to the internal Event Bus.
        """
        log_type_id = raw_log.get("logtype", 0)
        service = self._map_service(log_type_id)
        
        event = DeceptionEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
            service=service,
            src_ip=raw_log.get("src_host", "0.0.0.0"),
            src_port=raw_log.get("src_port", 0),
            dst_ip=raw_log.get("dst_host", "0.0.0.0"),
            dst_port=raw_log.get("dst_port", 0),
            log_type=raw_log.get("logdata", {}).get("msg", "interaction"),
            payload=raw_log.get("logdata", {})
        )
        
        # Determine specific Event Type based on service
        evt_type = EventType.HONEYPOT_INTERACTION_DETECTED
        if service == HoneypotService.SSH and "login attempt" in event.log_type.lower():
            evt_type = EventType.HONEYPOT_INTERACTION_DETECTED # Or a custom one like SSHBruteForceDetected
            
        # Publish to Event Bus for TI Enrichment, SIEM Ingestion, and AI Analysis
        await event_bus.publish(Event(
            event_type=evt_type,
            payload=event.model_dump(),
            source_module="deception"
        ))
        
        logger.info(f"Ingested Deception Event: {service.value} from {event.src_ip}")
        return event
