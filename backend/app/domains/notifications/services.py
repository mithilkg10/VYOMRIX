import logging
import aiohttp
from typing import Dict, Any

from app.core.config import settings
from app.core.events.bus import event_bus, EventType, Event

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # We subscribe to incident creation to notify slack/teams
        event_bus.subscribe(EventType.INCIDENT_CREATED, self.handle_incident_created)

    async def handle_incident_created(self, event: Event):
        """Handle new incident event and send notification."""
        payload = event.payload
        title = payload.get("title", "Unknown Incident")
        severity = payload.get("severity", "UNKNOWN")
        incident_id = payload.get("id", "UNKNOWN")
        
        message = f"🚨 *New Incident Created* 🚨\n*ID:* {incident_id}\n*Severity:* {severity}\n*Title:* {title}"
        await self.send_slack_notification(message)

    async def send_slack_notification(self, text: str):
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        if not webhook_url:
            logger.info("SLACK_WEBHOOK_URL not configured, skipping notification.")
            return
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json={"text": text},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status >= 400:
                        logger.error(f"Failed to send Slack notification: {response.status}")
                    else:
                        logger.info("Slack notification sent successfully.")
        except Exception as e:
            logger.error(f"Error sending Slack notification: {e}")

import os
notification_service = NotificationService()
