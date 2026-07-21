import asyncio
import logging
from typing import List, Optional
from .schemas import IOCType, NormalizedIOC, RiskLevel, ProviderResult
from .providers.base import ThreatIntelProvider
from .providers.implementations import VirusTotalProvider, AbuseIPDBProvider

logger = logging.getLogger(__name__)

class ThreatIntelEngine:
    def __init__(self):
        # In a real app, this would dynamically load plugins or use Dependency Injection
        self.providers: List[ThreatIntelProvider] = [
            VirusTotalProvider(),
            AbuseIPDBProvider()
        ]
        
    async def enrich_ioc(self, ioc_value: str, ioc_type: IOCType) -> NormalizedIOC:
        """
        Enrich an IOC using all supported providers concurrently.
        """
        tasks = []
        for provider in self.providers:
            if ioc_type in provider.supported_types:
                tasks.append(provider.lookup(ioc_value, ioc_type))
                
        # Execute all lookups concurrently, ignoring failures
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        provider_results = []
        for res in results:
            if isinstance(res, ProviderResult):
                provider_results.append(res)
            elif isinstance(res, Exception):
                logger.error(f"Provider lookup failed: {res}")
                
        return self._normalize_and_score(ioc_value, ioc_type, provider_results)
        
    def _normalize_and_score(self, ioc_value: str, ioc_type: IOCType, provider_results: List[ProviderResult]) -> NormalizedIOC:
        """
        Calculates a unified Risk Score based on provider results.
        """
        total_confidence = 0
        malicious_hits = 0
        all_tags = set()
        
        for p in provider_results:
            all_tags.update(p.tags)
            if p.is_malicious:
                malicious_hits += 1
                total_confidence += p.confidence
                
        # Very basic scoring logic
        risk_score = 0
        if malicious_hits > 0:
            risk_score = min(100, (total_confidence / len(provider_results)) + (malicious_hits * 10))
            
        risk_level = RiskLevel.UNKNOWN
        if risk_score > 80:
            risk_level = RiskLevel.CRITICAL
        elif risk_score > 60:
            risk_level = RiskLevel.HIGH
        elif risk_score > 30:
            risk_level = RiskLevel.MEDIUM
        elif risk_score > 0:
            risk_level = RiskLevel.LOW
        elif len(provider_results) > 0 and risk_score == 0:
            risk_level = RiskLevel.CLEAN
            
        return NormalizedIOC(
            ioc_value=ioc_value,
            ioc_type=ioc_type,
            risk_level=risk_level,
            risk_score=int(risk_score),
            tags=list(all_tags),
            providers=provider_results
        )
