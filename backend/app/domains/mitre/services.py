from typing import List, Dict, Optional
from .schemas import Technique, Tactic, CoverageLevel, TacticCoverage

class MitreManager:
    def __init__(self):
        self._techniques: Dict[str, Technique] = self._seed_techniques()

    def _seed_techniques(self) -> Dict[str, Technique]:
        # Simulated STIX knowledge base subset
        mock_techniques = [
            Technique(
                id="T1190",
                name="Exploit Public-Facing Application",
                description="Adversaries may attempt to exploit a weakness in an Internet-facing host or system to initially access a network.",
                tactics=[Tactic.INITIAL_ACCESS],
                data_sources=["Application Log: Application Log Content", "Network Traffic: Network Traffic Content"],
                mitigations=["Application Isolation and Sandboxing", "Exploit Prevention", "Update Software"],
                coverage=CoverageLevel.HIGH, # Covered by WAF
                linked_sigma_rules=[],
                linked_wazuh_rules=["wazuh-waf-001"]
            ),
            Technique(
                id="T1059.001",
                name="PowerShell",
                description="Adversaries may abuse PowerShell commands and scripts for execution.",
                tactics=[Tactic.EXECUTION],
                data_sources=["Command: Command Execution", "Process: Process Creation"],
                mitigations=["Execution Prevention", "Privileged Account Management"],
                coverage=CoverageLevel.MEDIUM, # Covered by Sigma Rule
                linked_sigma_rules=["1111-2222-3333-4444"],
                linked_wazuh_rules=["wazuh-sysmon-91500"]
            ),
            Technique(
                id="T1110",
                name="Brute Force",
                description="Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.",
                tactics=[Tactic.CREDENTIAL_ACCESS],
                data_sources=["Logon Session: Logon Session Creation"],
                mitigations=["Account Use Policies", "Multi-factor Authentication"],
                coverage=CoverageLevel.HIGH, # Covered by Honeypot and Wazuh
                linked_sigma_rules=[],
                linked_wazuh_rules=["wazuh-ssh-5710"]
            ),
            Technique(
                id="T1053.005",
                name="Scheduled Task",
                description="Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution of malicious code.",
                tactics=[Tactic.EXECUTION, Tactic.PERSISTENCE, Tactic.PRIVILEGE_ESCALATION],
                data_sources=["Process: Process Creation", "Scheduled Job: Scheduled Job Creation"],
                mitigations=["Privileged Account Management", "User Account Management"],
                coverage=CoverageLevel.NONE,
                linked_sigma_rules=[],
                linked_wazuh_rules=[]
            )
        ]
        return {t.id: t for t in mock_techniques}

    async def get_all_techniques(self) -> List[Technique]:
        return list(self._techniques.values())
        
    async def get_technique(self, technique_id: str) -> Optional[Technique]:
        return self._techniques.get(technique_id)

    async def calculate_coverage(self) -> List[TacticCoverage]:
        """Calculates defensive coverage aggregated by Tactic."""
        # Initialize counts
        tactic_counts = {t: {"total": 0, "covered": 0} for t in Tactic}
        
        for tech in self._techniques.values():
            for tactic in tech.tactics:
                tactic_counts[tactic]["total"] += 1
                if tech.coverage in [CoverageLevel.LOW, CoverageLevel.MEDIUM, CoverageLevel.HIGH]:
                    tactic_counts[tactic]["covered"] += 1
                    
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
        gaps = []
        for tech in self._techniques.values():
            if tech.coverage == CoverageLevel.NONE:
                gaps.append(tech)
        return gaps
