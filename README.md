# Vyomrix Security Platform

![Vyomrix Logo](./assets/Vyomrix-logo.png)

**Enterprise-Grade AI-Powered XDR and SOC Platform (v1.0)**

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
- **Enterprise Features:** Role-Based Access Control (RBAC), Audit Logging, Automated HTML/PDF Reporting, and Webhook Notifications (Slack/Teams).

## Architecture Overview

Vyomrix uses a microservices architecture orchestrated by Docker Compose:

- **Frontend:** Next.js (React, TypeScript, TailwindCSS, shadcn/ui, Framer Motion)
- **Backend:** FastAPI (Python, Async, Celery, PostgreSQL, Redis)
- **Engines:** Wazuh, OpenCanary, ModSecurity/SafeLine
- **AI Engine:** Google Gemini, FAISS, LangChain

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.10+
- Node.js 18+

### Installation & Execution (Local Development)

1. **Clone the repository.**
2. **Environment Setup:** Copy `.env.example` to `.env` in the root and in the `backend/` folder. Fill in your API keys (e.g., Gemini, VirusTotal).
3. **Start the Infrastructure Stack:**
   ```bash
   # Starts PostgreSQL and Redis
   docker-compose up -d postgres redis
   ```
4. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Run DB Migrations
   python -m alembic upgrade head
   
   # Seed the Database with Super Admin and Demo Data
   $env:PYTHONPATH="."  # (Or export PYTHONPATH="." on Linux/Mac)
   python app/core/db_seeder.py
   
   # Start the Backend Server
   uvicorn app.main:app --reload --port 8000
   ```
5. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Default Credentials
After running the seeder, you can log in with:
- **Email:** `admin@vyomrix.com`
- **Password:** `vyomrix_admin`

## Documentation
- [Architecture Overview](./docs/architecture/overview.md)
- [API Reference](./docs/api-reference.md)
- [Threat Model](./docs/threat-model.md)

---
*Vyomrix - CyberFusion XDR Platform*
