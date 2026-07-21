from abc import ABC, abstractmethod
from typing import Optional, List
from ..schemas import IOCType, ProviderResult

class ThreatIntelProvider(ABC):
    """Abstract base class for all Threat Intelligence plugins."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the provider (e.g., 'VirusTotal', 'AbuseIPDB')."""
        pass
        
    @property
    @abstractmethod
    def supported_types(self) -> List[IOCType]:
        """List of IOC types this provider supports."""
        pass
        
    @abstractmethod
    async def lookup(self, ioc_value: str, ioc_type: IOCType) -> Optional[ProviderResult]:
        """
        Perform a lookup for the given IOC.
        Returns None if the provider does not support this IOC type or if the lookup fails gracefully.
        """
        pass
