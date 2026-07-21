import uuid
from typing import List, Optional, Dict
from datetime import datetime
from .schemas import Asset, AssetType, Environment, Criticality, HealthStatus

class AssetManager:
    def __init__(self):
        # In a real system, this would be a database connection.
        self._assets: Dict[str, Asset] = self._seed_assets()
        
    def _seed_assets(self) -> Dict[str, Asset]:
        mock_assets = [
            Asset(
                id="ast-1001",
                hostname="prod-web-01",
                ip_address="192.168.1.100",
                os_name="Ubuntu 22.04 LTS",
                asset_type=AssetType.SERVER,
                environment=Environment.PRODUCTION,
                criticality=Criticality.HIGH,
                owner="Web Ops Team",
                tags=["pci-dss", "frontend"],
                has_wazuh_agent=True,
                protected_by_waf=True,
                is_internet_facing=True
            ),
            Asset(
                id="ast-1002",
                hostname="vyomrix-honeypot-01",
                ip_address="10.0.0.50",
                os_name="Ubuntu 20.04 LTS",
                asset_type=AssetType.HONEYPOT,
                environment=Environment.PRODUCTION,
                criticality=Criticality.LOW,
                owner="Security Operations",
                tags=["deception", "internal"],
                has_wazuh_agent=False,
                protected_by_waf=False,
                is_internet_facing=False
            ),
            Asset(
                id="ast-1003",
                hostname="db-primary-cluster",
                ip_address="10.0.0.80",
                os_name="RHEL 9",
                asset_type=AssetType.SERVER,
                environment=Environment.PRODUCTION,
                criticality=Criticality.CRITICAL,
                owner="Database Admins",
                tags=["pii", "database"],
                has_wazuh_agent=True,
                protected_by_waf=False,
                is_internet_facing=False
            )
        ]
        return {a.id: a for a in mock_assets}

    async def get_all_assets(self) -> List[Asset]:
        return list(self._assets.values())
        
    async def get_asset_by_ip(self, ip_address: str) -> Optional[Asset]:
        for asset in self._assets.values():
            if asset.ip_address == ip_address:
                return asset
        return None
        
    async def get_asset(self, asset_id: str) -> Optional[Asset]:
        return self._assets.get(asset_id)
        
    async def create_asset(self, asset: Asset) -> Asset:
        self._assets[asset.id] = asset
        return asset
