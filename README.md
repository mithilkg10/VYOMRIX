# Vyomrix Security Platform

![Vyomrix Logo](./assets/Vyomrix-logo.png)

**Enterprise-Grade AI-Powered XDR and SOC Platform**

Vyomrix is a comprehensive, unified cybersecurity platform designed for modern Security Operations Centers. Built with Next.js, FastAPI, and powered by Gemini AI, Vyomrix integrates SIEM capabilities, Web Application Firewalls, Honeypots, Threat Intelligence, and automated Incident Response into a single, polished glassmorphism dashboard.

## Features

- **Unified Dashboard:** A single pane of glass for all security operations.
- **Wazuh SIEM Integration:** Real-time log monitoring, alerting, and agent management.
- **AI SOC Analyst:** ChatGPT-style interface powered by Gemini to explain alerts, suggest mitigations, and generate Sigma rules.
- **AI Phishing Analyzer:** Upload emails or attachments for AI-driven risk assessment and OCR extraction.
- **Threat Intelligence:** Automated lookup of IOCs via VirusTotal, AbuseIPDB, and AlienVault OTX.
- **Honeypot Monitoring:** Integrated OpenCanary deployment to detect network reconnaissance.
- **Web Application Firewall:** DVWA protected by a configured WAF, managed from Vyomrix.
- **Detection Engineering:** Interactive Sigma/YARA rule generation and testing.
- **MITRE ATT&CK Matrix:** Interactive mapping of organizational coverage against TTPs.

## Architecture Overview

Vyomrix uses a microservices architecture orchestrated by Docker Compose and Traefik:

- **Frontend:** Next.js (React, TypeScript, TailwindCSS, shadcn/ui, Framer Motion)
- **Backend:** FastAPI (Python, Async, Celery, PostgreSQL, Redis)
- **Engines:** Wazuh, OpenCanary, ModSecurity/SafeLine
- **AI Engine:** Google Gemini, FAISS, LangChain

See [Architecture Documentation](./docs/architecture/overview.md) for detailed diagrams and data flow.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.10+
- Node.js 18+

### Installation
1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your API keys (e.g., Gemini, VirusTotal).
3. Start the core infrastructure:
   ```bash
   docker-compose up -d
   ```
4. Follow the specific setup guides for the frontend, backend, and security engines in the `docs` folder.

## Documentation
- [Architecture Overview](./docs/architecture/overview.md)
- [API Reference](./docs/api-reference.md)
- [Threat Model](./docs/threat-model.md)

## Screenshots
*(Add screenshots here)*

---
*Vyomrix - CyberFusion XDR Platform*
