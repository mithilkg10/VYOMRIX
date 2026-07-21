import logging
from typing import Optional, List
from .base import ThreatIntelProvider
from ..schemas import IOCType, ProviderResult

logger = logging.getLogger(__name__)

class VirusTotalProvider(ThreatIntelProvider):
    @property
    def name(self) -> str:
        return "VirusTotal"
        
    @property
    def supported_types(self) -> List[IOCType]:
        return [IOCType.IP, IOCType.DOMAIN, IOCType.URL, IOCType.HASH]
        
    async def lookup(self, ioc_value: str, ioc_type: IOCType) -> Optional[ProviderResult]:
        if ioc_type not in self.supported_types:
            return None
            
        logger.info(f"[{self.name}] Querying {ioc_type.value}: {ioc_value}")
        
        # In a real implementation, make async HTTP request to VT API v3 here.
        # Returning mock data for demonstration.
        is_malicious = False
        confidence = 0
        tags = []
        
        if "malicious" in ioc_value.lower() or ioc_value == "185.15.22.1":
            is_malicious = True
            confidence = 85
            tags = ["malware", "botnet"]
            
        return ProviderResult(
            provider_name=self.name,
            is_malicious=is_malicious,
            confidence=confidence,
            tags=tags,
            raw_data={"stats": {"malicious": 5 if is_malicious else 0, "harmless": 80}}
        )

class AbuseIPDBProvider(ThreatIntelProvider):
    @property
    def name(self) -> str:
        return "AbuseIPDB"
        
    @property
    def supported_types(self) -> List[IOCType]:
        return [IOCType.IP]
        
    async def lookup(self, ioc_value: str, ioc_type: IOCType) -> Optional[ProviderResult]:
        if ioc_type not in self.supported_types:
            return None
            
        logger.info(f"[{self.name}] Querying {ioc_type.value}: {ioc_value}")
        
        is_malicious = False
        confidence = 0
        tags = []
        
        if ioc_value == "185.15.22.1":
            is_malicious = True
            confidence = 99
            tags = ["ssh-bruteforce", "vpn"]
            
        return ProviderResult(
            provider_name=self.name,
            is_malicious=is_malicious,
            confidence=confidence,
            tags=tags,
            raw_data={"abuseConfidenceScore": confidence, "countryCode": "RU"}
        )
