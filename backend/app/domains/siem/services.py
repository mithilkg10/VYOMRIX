import base64
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from pydantic import ValidationError

from app.core.config import settings
from .schemas import AgentInfo, AlertSource, MITREInfo, NormalizedAlert

logger = logging.getLogger(__name__)


class WazuhIntegrationUnavailable(Exception):
    """The configured Wazuh integration cannot currently provide data."""


class WazuhUpstreamError(Exception):
    """Wazuh returned a response that does not match its expected contract."""


class WazuhClient:
    def __init__(self) -> None:
        self.manager_url = settings.WAZUH_MANAGER_URL.rstrip("/") if settings.WAZUH_MANAGER_URL else None
        self.manager_user = settings.WAZUH_MANAGER_USER
        self.manager_password = settings.WAZUH_MANAGER_PASSWORD
        self.indexer_url = settings.WAZUH_INDEXER_URL.rstrip("/") if settings.WAZUH_INDEXER_URL else None
        self.indexer_user = settings.WAZUH_INDEXER_USER
        self.indexer_password = settings.WAZUH_INDEXER_PASSWORD
        self.token: Optional[str] = None
        self.client = httpx.AsyncClient(verify=False, timeout=httpx.Timeout(10.0))

    def _require_manager_configuration(self) -> None:
        if not self.manager_url or not self.manager_user or not self.manager_password:
            raise WazuhIntegrationUnavailable("Wazuh manager is not configured.")

    def _require_indexer_configuration(self) -> None:
        if not self.indexer_url or not self.indexer_user or not self.indexer_password:
            raise WazuhIntegrationUnavailable("Wazuh indexer is not configured.")

    async def _authenticate(self) -> None:
        self._require_manager_configuration()
        auth_string = base64.b64encode(f"{self.manager_user}:{self.manager_password}".encode()).decode()
        try:
            response = await self.client.get(f"{self.manager_url}/security/user/authenticate", headers={"Authorization": f"Basic {auth_string}"})
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            logger.warning("Wazuh manager authentication failed: %s", type(error).__name__)
            raise WazuhIntegrationUnavailable("Wazuh manager authentication is unavailable.") from error
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), dict) or not isinstance(payload["data"].get("token"), str):
            raise WazuhUpstreamError("Wazuh manager authentication response is invalid.")
        self.token = payload["data"]["token"]

    @staticmethod
    def _parse_timestamp(value: object) -> datetime:
        if not isinstance(value, str):
            raise WazuhUpstreamError("Wazuh event timestamp is invalid.")
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise WazuhUpstreamError("Wazuh event timestamp is invalid.") from error

    async def get_agents(self) -> List[AgentInfo]:
        if not self.token:
            await self._authenticate()
        try:
            response = await self.client.get(f"{self.manager_url}/agents", headers={"Authorization": f"Bearer {self.token}"})
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            logger.warning("Wazuh manager agent request failed: %s", type(error).__name__)
            raise WazuhIntegrationUnavailable("Wazuh agent data is unavailable.") from error
        try:
            data = payload["data"]["affected_items"]
            if not isinstance(data, list):
                raise TypeError
            agents = []
            for agent in data:
                if not isinstance(agent, dict):
                    raise TypeError
                operating_system = agent.get("os") or {}
                if not isinstance(operating_system, dict):
                    raise TypeError
                keepalive = agent.get("lastKeepAlive")
                agents.append(AgentInfo(id=agent["id"], name=agent["name"], ip=agent.get("ip"), os_name=operating_system.get("name"), os_version=operating_system.get("version"), status=agent["status"], last_keepalive=self._parse_timestamp(keepalive) if keepalive else None, version=agent.get("version")))
            return agents
        except (KeyError, TypeError, ValidationError, WazuhUpstreamError) as error:
            logger.warning("Wazuh manager returned invalid agent data: %s", type(error).__name__)
            raise WazuhUpstreamError("Wazuh agent data is invalid.") from error

    async def get_alerts(self, limit: int = 50) -> List[NormalizedAlert]:
        self._require_indexer_configuration()
        query = {"query": {"match_all": {}}, "sort": [{"timestamp": {"order": "desc"}}], "size": limit}
        try:
            response = await self.client.post(f"{self.indexer_url}/wazuh-alerts-*/_search", json=query, auth=(self.indexer_user, self.indexer_password))
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            logger.warning("Wazuh indexer alert request failed: %s", type(error).__name__)
            raise WazuhIntegrationUnavailable("Wazuh alert data is unavailable.") from error
        try:
            hits = payload["hits"]["hits"]
            if not isinstance(hits, list):
                raise TypeError
            alerts = []
            for hit in hits:
                if not isinstance(hit, dict) or not isinstance(hit.get("_source"), dict):
                    raise TypeError
                source: Dict[str, Any] = hit["_source"]
                rule = source.get("rule")
                agent = source.get("agent") or {}
                if not isinstance(rule, dict) or not isinstance(agent, dict) or not isinstance(hit.get("_id"), str):
                    raise TypeError
                mitre = rule.get("mitre") or {}
                if not isinstance(mitre, dict):
                    raise TypeError
                alerts.append(NormalizedAlert(id=hit["_id"], timestamp=self._parse_timestamp(source.get("timestamp")), title=rule["description"], description=None, severity=rule["level"], source=AlertSource(name="Wazuh", ip=agent.get("ip"), agent_id=agent.get("id"), agent_name=agent.get("name")), rule_id=str(rule["id"]), mitre=MITREInfo(id=mitre.get("id", []), tactic=mitre.get("tactic", []), technique=mitre.get("technique", [])), raw_data={}, tags=rule.get("groups", [])))
            return alerts
        except (KeyError, TypeError, ValidationError, WazuhUpstreamError) as error:
            logger.warning("Wazuh indexer returned invalid alert data: %s", type(error).__name__)
            raise WazuhUpstreamError("Wazuh alert data is invalid.") from error
