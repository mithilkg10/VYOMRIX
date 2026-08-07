import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from .schemas import WAFEvent, WAFEventType
from app.core.events.bus import event_bus, Event, EventType

logger = logging.getLogger(__name__)

class WAFManager:
    def _map_rule_to_event_type(self, rule_message: str) -> WAFEventType:
        msg = rule_message.lower()
        if "sql" in msg or "sqli" in msg:
            return WAFEventType.SQL_INJECTION
        if "xss" in msg or "cross-site scripting" in msg:
            return WAFEventType.XSS
        if "traversal" in msg or "lfi" in msg or "rfi" in msg:
            return WAFEventType.PATH_TRAVERSAL
        if "injection" in msg and "command" in msg:
            return WAFEventType.COMMAND_INJECTION
        return WAFEventType.UNKNOWN

    async def ingest_modsec_log(self, raw_log: Dict[str, Any]) -> WAFEvent:
        """
        Parses a raw JSON log from ModSecurity/OWASP CRS.
        Normalizes it and publishes to the Event Bus.
        """
        # A real ModSec JSON log is complex, this parses a simplified representation
        # typically forwarded by Filebeat or fluentd
        transaction = raw_log.get("transaction", {})
        client_ip = transaction.get("client_ip", "0.0.0.0")
        request = transaction.get("request", {})
        messages = transaction.get("messages", [])
        
        # Pick the most severe rule hit
        primary_msg = messages[0] if messages else {}
        rule_message = primary_msg.get("message", "Unknown WAF Alert")
        
        event_type = self._map_rule_to_event_type(rule_message)
        
        event = WAFEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
            event_type=event_type,
            src_ip=client_ip,
            http_method=request.get("method", "GET"),
            http_uri=request.get("uri", "/"),
            user_agent=request.get("headers", {}).get("User-Agent", "Unknown"),
            rule_id=str(primary_msg.get("details", {}).get("ruleId", "0")),
            rule_message=rule_message,
            action_taken=str(transaction.get("action", "Unknown")),
        )
        
        # Determine specific EventBus Event Type
        # Map our specific WAFEventType to the global EventType.WAF_ATTACK_DETECTED
        # We can pass the specifics in the payload
        await event_bus.publish(Event(
            event_type=EventType.WAF_ATTACK_DETECTED,
            payload=event.model_dump(),
            source_module="waf"
        ))
        
        logger.info(f"Ingested WAF Event: {event_type.value} from {client_ip}")
        return event
