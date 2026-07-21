import httpx
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import base64

from .schemas import NormalizedAlert, AgentInfo, AlertSource, MITREInfo

logger = logging.getLogger(__name__)

class WazuhClient:
    """Modular client to interact with Wazuh Manager and OpenSearch."""
    
    def __init__(
        self, 
        manager_url: str = "https://localhost:55000",
        indexer_url: str = "https://localhost:9200",
        user: str = "wazuh",
        password: str = "wazuh",
        indexer_password: str = "SecretPassword123!"
    ):
        self.manager_url = manager_url.rstrip('/')
        self.indexer_url = indexer_url.rstrip('/')
        self.user = user
        self.password = password
        self.indexer_password = indexer_password
        self.token = None
        
        # We disable SSL verification for local self-signed certs
        self.client = httpx.AsyncClient(verify=False)
        
    async def _authenticate(self):
        """Get JWT token from Wazuh Manager."""
        auth_string = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        headers = {"Authorization": f"Basic {auth_string}"}
        
        try:
            response = await self.client.get(f"{self.manager_url}/security/user/authenticate", headers=headers)
            response.raise_for_status()
            data = response.json()
            self.token = data.get("data", {}).get("token")
        except Exception as e:
            logger.error(f"Failed to authenticate with Wazuh API: {e}")
            self.token = None

    async def get_agents(self) -> List[AgentInfo]:
        """Fetch agents from Wazuh Manager."""
        if not self.token:
            await self._authenticate()
            if not self.token:
                return self._mock_agents()

        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = await self.client.get(f"{self.manager_url}/agents", headers=headers)
            response.raise_for_status()
            data = response.json().get("data", {}).get("affected_items", [])
            
            return [
                AgentInfo(
                    id=agent.get("id"),
                    name=agent.get("name"),
                    ip=agent.get("ip"),
                    os_name=agent.get("os", {}).get("name"),
                    os_version=agent.get("os", {}).get("version"),
                    status=agent.get("status"),
                    last_keepalive=datetime.fromisoformat(agent.get("lastKeepAlive").replace('Z', '+00:00')) if agent.get("lastKeepAlive") else None,
                    version=agent.get("version")
                )
                for agent in data
            ]
        except Exception as e:
            logger.error(f"Failed to fetch agents: {e}")
            return self._mock_agents()

    async def get_alerts(self, limit: int = 50) -> List[NormalizedAlert]:
        """Fetch recent alerts from Wazuh Indexer (OpenSearch)."""
        auth = ("admin", self.indexer_password)
        query = {
            "query": {"match_all": {}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit
        }
        
        try:
            # Attempt to search the wazuh-alerts-* index pattern
            response = await self.client.post(
                f"{self.indexer_url}/wazuh-alerts-*/_search",
                json=query,
                auth=auth
            )
            response.raise_for_status()
            hits = response.json().get("hits", {}).get("hits", [])
            
            alerts = []
            for hit in hits:
                source = hit.get("_source", {})
                rule = source.get("rule", {})
                agent = source.get("agent", {})
                
                alerts.append(NormalizedAlert(
                    id=hit.get("_id"),
                    timestamp=datetime.fromisoformat(source.get("timestamp").replace('Z', '+00:00')) if source.get("timestamp") else datetime.now(timezone.utc),
                    title=rule.get("description", "Unknown Alert"),
                    severity=rule.get("level", 0),
                    source=AlertSource(
                        name="Wazuh",
                        ip=agent.get("ip"),
                        agent_id=agent.get("id"),
                        agent_name=agent.get("name")
                    ),
                    rule_id=str(rule.get("id", "")),
                    mitre=MITREInfo(
                        id=rule.get("mitre", {}).get("id", []),
                        tactic=rule.get("mitre", {}).get("tactic", []),
                        technique=rule.get("mitre", {}).get("technique", [])
                    ),
                    raw_data=source,
                    tags=rule.get("groups", [])
                ))
            return alerts
        except Exception as e:
            logger.error(f"Failed to fetch alerts from indexer: {e}")
            return self._mock_alerts()
            
    def _mock_agents(self) -> List[AgentInfo]:
        """Return fallback mock data when Wazuh is unreachable."""
        return [
            AgentInfo(
                id="000",
                name="vyomrix-server",
                ip="127.0.0.1",
                os_name="Ubuntu",
                os_version="22.04.1 LTS",
                status="active",
                last_keepalive=datetime.now(timezone.utc),
                version="Wazuh v4.9.0"
            ),
            AgentInfo(
                id="001",
                name="win-desktop-01",
                ip="192.168.1.105",
                os_name="Windows 11",
                os_version="10.0.22621",
                status="disconnected",
                last_keepalive=datetime.now(timezone.utc),
                version="Wazuh v4.9.0"
            )
        ]
        
    def _mock_alerts(self) -> List[NormalizedAlert]:
        """Return fallback mock data when Wazuh is unreachable."""
        now = datetime.now(timezone.utc)
        return [
            NormalizedAlert(
                id="mock-1",
                timestamp=now,
                title="Suspicious PowerShell Execution Detected",
                severity=12,
                source=AlertSource(name="Wazuh", agent_id="001", agent_name="win-desktop-01", ip="192.168.1.105"),
                rule_id="91802",
                mitre=MITREInfo(id=["T1059.001"], tactic=["Execution"], technique=["PowerShell"]),
                raw_data={"command": "powershell.exe -enc JABz..."},
                tags=["windows", "powershell", "sysmon"]
            ),
            NormalizedAlert(
                id="mock-2",
                timestamp=now,
                title="Multiple SSH Authentication Failures",
                severity=8,
                source=AlertSource(name="Wazuh", agent_id="000", agent_name="vyomrix-server", ip="127.0.0.1"),
                rule_id="5716",
                mitre=MITREInfo(id=["T1110.001"], tactic=["Credential Access"], technique=["Password Guessing"]),
                raw_data={"srcip": "185.15.22.1"},
                tags=["sshd", "authentication_failed"]
            )
        ]
