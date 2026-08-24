from typing import List, Dict, Optional
from .schemas import Technique, Tactic, CoverageLevel, TacticCoverage
from .repository import MitreRepository

class MitreManager:
    def __init__(self, repository: MitreRepository):
        self.repository = repository

    async def get_all_techniques(self) -> List[Technique]:
        models = await self.repository.get_all()
        return [Technique.model_validate(m, from_attributes=True) for m in models]
        
    async def get_technique(self, technique_id: str) -> Optional[Technique]:
        model = await self.repository.get_by_id(technique_id)
        if model:
            return Technique.model_validate(model, from_attributes=True)
        return None

    async def calculate_coverage(self) -> List[TacticCoverage]:
        """Calculates defensive coverage aggregated by Tactic."""
        models = await self.repository.get_all()
        
        # Initialize counts
        tactic_counts = {t: {"total": 0, "covered": 0} for t in Tactic}
        
        for tech in models:
            for tactic in tech.tactics:
                t_enum = Tactic(tactic)
                tactic_counts[t_enum]["total"] += 1
                if tech.coverage in [CoverageLevel.LOW, CoverageLevel.MEDIUM, CoverageLevel.HIGH]:
                    tactic_counts[t_enum]["covered"] += 1
                    
        results = []
        for tactic, counts in tactic_counts.items():
            if counts["total"] > 0:
                pct = (counts["covered"] / counts["total"]) * 100
                results.append(TacticCoverage(
                    tactic=tactic,
                    total_techniques=counts["total"],
                    covered_techniques=counts["covered"],
                    coverage_percentage=round(pct, 2)
                ))
        return results
        
    async def get_gap_analysis(self) -> List[Technique]:
        """Returns techniques with ZERO coverage to highlight gaps."""
        models = await self.repository.get_all()
        gaps = [m for m in models if m.coverage == CoverageLevel.NONE]
        return [Technique.model_validate(m, from_attributes=True) for m in gaps]
