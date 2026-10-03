# VYOMRIX Security Platform

[Portfolio case study](https://mithilkg-portfolio.vercel.app/projects/vyomrix-security-platform) · [Documented Cyber Defense Lab investigations](https://github.com/mithilkg10/MKG-Cyber-Defense-Lab)

**SIEM & Security Operations Platform with XDR-style detection and incident workflows.**

VYOMRIX is a full stack cybersecurity engineering project built to demonstrate how multiple security operations capabilities can be brought into one coherent platform. The project combines a Next.js frontend, a FastAPI backend, PostgreSQL, Redis, background task processing, security integrations, automated tests, and end to end validation.

## Problem and current scope

Security analysts need one traceable path from SIEM telemetry to detection review, incident investigation, audit history, and reporting. VYOMRIX brings these workflows together in a full-stack engineering project.

The current reviewable implementation includes authenticated incident, asset, SIEM, dashboard, audit, report, MITRE, detection-rule, and health views. Wazuh and other external providers require configuration; unavailable integrations are called out in [release readiness](RELEASE_READINESS.md). The [Cyber Defense Lab](https://github.com/mithilkg10/MKG-Cyber-Defense-Lab) documents six controlled investigations using VYOMRIX as the analyst workflow.

## Architecture

```text
Wazuh security telemetry (when configured)
                 |
                 v
          FastAPI security services
             /           \
            v             v
      PostgreSQL         Redis
            \             /
             v           v
        Incident, detection, audit
         and reporting workflows
                 |
                 v
          Next.js analyst interface
```

PostgreSQL stores application state; Redis supports background work and failure handling. External security integrations stay behind provider boundaries. See [architecture decisions](ARCHITECTURE_DECISIONS.md) and [architecture documentation](docs/architecture/overview.md).

## Security capabilities

* **SIEM and telemetry:** Wazuh alert, event, and agent views when a real manager is configured.
* **Detection and investigation:** detection-rule workflows, MITRE ATT&CK mapping views, incident timelines, and reports.
* **Access and audit:** authentication, role-based permissions, audit records, and explicit release boundaries.
* **Threat intelligence, AI, WAF, and deception:** provider-dependent or limited workflows; [release readiness](RELEASE_READINESS.md) identifies what is unavailable without configuration or further implementation.

## Technology

* Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
* Backend: FastAPI, Python, asynchronous services
* Persistence: PostgreSQL
* Caching and task support: Redis
* Testing: Pytest, coverage, Playwright
* Security integrations: Wazuh, OpenCanary, WAF tooling, threat intelligence providers
* Deployment: Docker Compose and deployment assets

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
* `FEATURE_MATRIX.md`: historical planning matrix; use release readiness for current supported scope
* `docs/architecture/`: architecture documentation
* `docs/domains/`: domain specific technical documentation

## Security scope

VYOMRIX is a security engineering platform and portfolio project. It should be deployed only with proper secret management, TLS, network controls, production database configuration, provider credentials, logging, monitoring, backups, and infrastructure hardening.

## Project status

Active engineering project.

The strongest areas of the repository are the security domain breadth, backend architecture, persistent infrastructure, automated testing, end to end validation, and explicit release boundaries.

See `SHOWCASE.md` for a concise technical review path. No public product screenshots are committed; the Cyber Defense Lab provides reviewable investigation evidence.

[Portfolio](https://mithilkg-portfolio.vercel.app) · [LinkedIn](https://www.linkedin.com/in/mithil-k-gowda) · [GitHub profile](https://github.com/mithilkg10)
