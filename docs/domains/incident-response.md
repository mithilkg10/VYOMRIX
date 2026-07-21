# Vyomrix Incident Response & Case Management Platform

The Incident Response (IR) platform is the heart of Vyomrix SOC operations. It is responsible for transforming isolated alerts into consolidated, manageable cases.

## 1. Correlation Engine

A single attack might trigger 10 WAF alerts, 2 Honeypot alerts, and 5 Wazuh alerts. Reviewing these individually causes alert fatigue.

Vyomrix solves this with the **Correlation Engine** (`backend/app/domains/incidents/services.py`).
1. The engine subscribes to the Event Bus.
2. It groups incoming alerts by **Source IP** or **Asset ID** within a 30-minute rolling window.
3. If multiple events correlate, a single `Incident` is created (e.g., `INC-2026-001`).

## 2. Investigation Timeline

Every incident maintains a chronological timeline of events. Instead of jumping between dashboards, the analyst views a single timeline:
1. `14:00` - Honeypot SSH Brute Force (IP: X)
2. `14:01` - Threat Intel flags IP X as malicious.
3. `14:05` - WAF blocks SQLi from IP X against Production.
4. `14:10` - AI generates Executive Summary.

## 3. AI Incident Advisor

Vyomrix utilizes the decoupled AI Engine as an Incident Advisor.
When an incident is created, the AI automatically generates:
- **Executive Summary:** A high-level overview for non-technical stakeholders.
- **Containment Recommendations:** Immediate steps to stop the bleeding.

*Note: In Vyomrix, the AI is always advisory. It recommends actions (e.g., "Block IP on edge firewall"), but an Analyst must click the "Execute Playbook" button to apply the change.*

## 4. Playbooks

Playbooks are predefined standard operating procedures (SOPs). By linking playbooks to incidents, the platform ensures consistent response across the SOC team.
