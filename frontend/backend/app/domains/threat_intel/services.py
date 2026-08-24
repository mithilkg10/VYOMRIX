import logging
from .schemas import IOCType, NormalizedIOC

logger = logging.getLogger(__name__)

class ThreatIntelIntegrationUnavailable(Exception):
    """Raised when no production threat-intelligence integration is configured."""


class ThreatIntelEngine:
    async def enrich_ioc(self, ioc_value: str, ioc_type: IOCType) -> NormalizedIOC:
        """
        A real provider integration is not implemented in this deployment.
        """
        del ioc_value, ioc_type
        logger.warning("Threat intelligence lookup requested while no production provider is available")
        raise ThreatIntelIntegrationUnavailable()
