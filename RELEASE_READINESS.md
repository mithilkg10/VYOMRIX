# Vyomrix release readiness

## Supported workflows

- Authenticated incident, asset, SIEM, dashboard, audit, report, MITRE, detection-rule, and system-health views.
- Report generation is limited to existing incident records and server-generated downloads.
- Health displays only safe application, liveness, and readiness statuses.

## Intentionally unavailable capabilities

- AI generation has no configured production provider.
- Threat intelligence requires a real configured provider.
- WAF and Deception accept ingestion but have no analyst-facing event feed.
- Honeypot has no separate production analyst workflow.
- Notifications have no production contract.
- Administration has no safe user-management contract.

## Production configuration

Set `ENVIRONMENT=production`, a unique `SECRET_KEY` of at least 32 characters, and explicit comma-separated `ALLOWED_ORIGINS`. Configure database, broker, and optional Wazuh/provider credentials only in backend environment storage. Do not place credentials in frontend environment variables.

## Commands

Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000` from `backend` after database migration.

Frontend: `npm ci && npm run build && npm start` from `frontend`.

Validation: `python -B -m pytest -p no:cacheprovider tests -q`, `npm run lint`, `npm run type-check`, and `npm run build`.

## Health and storage

Health endpoints: `/api/v1/health/`, `/live`, and `/ready`. Generated reports require writable temporary storage; use durable managed storage before horizontally scaling report downloads.

## Release checklist

- Use explicit production secrets and origins.
- Apply database migrations before starting application workers.
- Configure optional Wazuh and intelligence providers only when operational.
- Verify all validation commands and confirm no generated cache artifacts in Git status.
