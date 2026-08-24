# VYOMRIX Security Platform

**Enterprise security operations platform for XDR, SOC workflows, threat intelligence, detection engineering, deception, incident response, and AI assisted analysis.**

VYOMRIX is a full stack cybersecurity engineering project built to demonstrate how multiple security operations capabilities can be brought into one coherent platform. The project combines a Next.js frontend, a FastAPI backend, PostgreSQL, Redis, background task processing, security integrations, automated tests, and end to end validation.

## Why this project matters

VYOMRIX is designed as an engineering showcase rather than a collection of disconnected dashboards. The repository demonstrates:

* Full stack security product architecture
* Authentication and role based access control
* PostgreSQL migrations and persistent application state
* Redis backed workflows and failure handling
* Wazuh SIEM integration
* Threat intelligence provider integrations
* Incident response workflows
* Detection engineering with Sigma and YARA concepts
* OpenCanary based deception monitoring
* Web Application Firewall workflows
* MITRE ATT&CK coverage views
* AI assisted security analysis
* Backend automated tests
* Playwright end to end tests
* Docker based development and deployment workflows

## Architecture

```text
Security data and integrations
            |
            v
      FastAPI backend
            |
   +--------+--------+
   |                 |
   v                 v
PostgreSQL         Redis
   |                 |
   +--------+--------+
            |
            v
      Security services
            |
   +--------+--------+
   |        |        |
   v        v        v
 SIEM      TI      AI services
   |        |        |
   +--------+--------+
            |
            v
      Next.js frontend
            |
            v
 Analyst and admin workflows
```

## Core capabilities

### Security Command Centre

The platform provides a unified analyst view for security events, incidents, assets, detections, intelligence, and operational status.

### SIEM integration

Wazuh integration provides security event and alert workflows while preserving clear provider boundaries.

### Threat intelligence

The backend supports provider based intelligence lookups and separates external integrations from the core application domain.

### Detection engineering

The platform includes workflows for Sigma and YARA oriented detection engineering, validation, and security coverage management.

### Deception

OpenCanary integration provides honeypot and deception monitoring for controlled lab and development environments.

### Incident response

Incident handling workflows connect alerts, investigation context, response actions, status tracking, and analyst activity.

### AI assisted analysis

AI features are isolated behind explicit integration boundaries. Features that require external providers remain unavailable when their production configuration is absent.

## Technology

* Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
* Backend: FastAPI, Python, asynchronous services
* Persistence: PostgreSQL
* Caching and task support: Redis
* Testing: Pytest, coverage, Playwright
* Security integrations: Wazuh, OpenCanary, WAF tooling, threat intelligence providers
* Deployment: Docker Compose and production deployment assets

## Local development

### Prerequisites

* Docker and Docker Compose
* Python 3.10 or later
* Node.js 18 or later

### Environment setup

Copy the example environment files and provide your own local values.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Never commit real credentials, API keys, signing secrets, or production database content.

### Start infrastructure

```bash
docker-compose up -d postgres redis
```

### Start the backend

```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

## Development account

A local development account can be created explicitly when required. The seeding workflow is restricted to local, test, or development environments.

```powershell
$env:ENVIRONMENT = "development"
$env:DEV_SEED_ENABLED = "true"
$env:DEV_SEED_EMAIL = "admin@mkg.local"
$env:DEV_SEED_PASSWORD = "<choose-a-local-password>"
python -m app.core.seed_development_user
```

Do not commit the password.

## Testing and validation

The repository includes backend automated tests and a GitHub Actions workflow that provisions PostgreSQL and Redis, applies migrations, runs backend tests with coverage, builds the frontend, starts the application, and runs Playwright end to end validation.

This gives the project a stronger engineering baseline than a UI only demonstration.

## Production readiness

VYOMRIX should be evaluated using the explicit release boundaries documented in `RELEASE_READINESS.md`.

Some capabilities depend on external security products or API providers and therefore require production configuration before they become operational. The repository does not treat unavailable integrations as completed production features.

## Documentation

* `RELEASE_READINESS.md`: supported workflows, deployment requirements, validation, and known limitations
* `ARCHITECTURE_DECISIONS.md`: important architectural decisions and tradeoffs
* `FEATURE_MATRIX.md`: feature status and implementation coverage
* `docs/architecture/`: architecture documentation
* `docs/domains/`: domain specific technical documentation

## Security scope

VYOMRIX is a security engineering platform and portfolio project. It should be deployed only with proper secret management, TLS, network controls, production database configuration, provider credentials, logging, monitoring, backups, and infrastructure hardening.

## Project status

Active engineering project.

The strongest areas of the repository are the security domain breadth, backend architecture, persistent infrastructure, automated testing, end to end validation, and explicit release boundaries.

See `SHOWCASE.md` for a concise technical review path.
