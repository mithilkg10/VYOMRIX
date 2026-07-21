# Vyomrix MITRE ATT&CK Platform

The MITRE ATT&CK Platform acts as the unifying knowledge layer for Vyomrix. Rather than viewing alerts in isolation, every detection rule (Sigma) and SIEM alert (Wazuh) is mapped to specific adversarial Tactics and Techniques.

## 1. Knowledge Model

Vyomrix simulates a subset of the official MITRE STIX database (`backend/app/domains/mitre/services.py`).
Each `Technique` contains:
- ID (e.g., T1059.001)
- Name & Description
- Associated Tactics (e.g., Execution, Persistence)
- Recommended Mitigations
- Detection Coverage Level

## 2. Coverage Engine

The `calculate_coverage` API aggregates all mapped detection rules across the platform.

```json
[
  {
    "tactic": "Initial Access",
    "total_techniques": 9,
    "covered_techniques": 4,
    "coverage_percentage": 44.4
  },
  {
    "tactic": "Execution",
    "total_techniques": 14,
    "covered_techniques": 10,
    "coverage_percentage": 71.4
  }
]
```
This allows the SOC manager to identify exactly where the enterprise is blind.

## 3. Gap Analysis & AI Integration

The `get_gaps` API identifies techniques with `CoverageLevel.NONE`.

The AI Platform leverages this data automatically:
1. The AI reviews the gap (e.g., *T1053.005 Scheduled Task*).
2. The AI cross-references the enterprise's Critical Assets.
3. If critical assets are exposed to this gap, the AI dynamically generates a Sigma rule to close the gap and pushes it to the Detection Engineering pipeline.
