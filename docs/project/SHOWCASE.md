# VYOMRIX Technical Showcase

This document provides a short review path for recruiters, security engineers, and technical interviewers.

## Start here

Review these areas first:

1. `README.md`
2. `RELEASE_READINESS.md`
3. `ARCHITECTURE_DECISIONS.md`
4. `backend/tests/`
5. `.github/workflows/e2e.yml`
6. `docs/architecture/`

## Engineering signals

The repository demonstrates:

* FastAPI backend architecture
* Next.js and TypeScript frontend engineering
* PostgreSQL persistence and migrations
* Redis integration and failure handling
* Authentication and role based access control
* Security operations domain modelling
* Automated backend tests
* Coverage execution
* Playwright end to end validation
* Docker based infrastructure
* Explicit production boundaries

## Security domains represented

* SIEM
* Threat intelligence
* Incident response
* Detection engineering
* MITRE ATT&CK
* Deception and honeypots
* Web Application Firewall workflows
* Asset intelligence
* AI assisted security analysis

## Review note

The project intentionally distinguishes implemented workflows from capabilities that still depend on external provider configuration. That boundary is documented in `RELEASE_READINESS.md`.
