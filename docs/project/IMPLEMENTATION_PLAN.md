# Vyomrix Implementation Plan

## Checkpoint 1 — Audit and Architecture (COMPLETED)
- **Baseline validation**: Completed. Noted that `npm ci` fails due to lockfile mismatches but `npm install` is stable. Backend tests pass with warnings. `docker-compose config` reveals missing variables that need addressing.
- **Feature Matrix**: Generated in `FEATURE_MATRIX.md`.
- **Architecture Decisions**: Documented in `ARCHITECTURE_DECISIONS.md`.
- **Migration Plan**: We will adopt a phase-by-phase migration, replacing mock endpoints and placeholders with real APIs and robust components starting from Auth -> Core Operations -> Advanced Intel -> Security Hardening.
- **Security Remediation Plan**: Secrets management will be moved exclusively to the backend. JWT flow will transition to short-lived access tokens and secure HTTP-only refresh tokens. All backend routes will strictly enforce RBAC. WAF/Wazuh endpoints will implement strict TLS verification.

## Checkpoint 2 — Platform Foundation
1. **Authentication & Sessions**: Replace simplistic cookie checks with robust JWT generation, HTTP-only refresh tokens, and Redis-backed session tracking and revocation.
2. **RBAC**: Implement robust role-based access control middleware for the FastAPI backend and permission-aware routing on the frontend.
3. **Application Shell**: Complete the sidebar, command palette, and topbar navigation, ensuring dynamic user profile integration.
4. **Design System & Motion**: Standardize Tailwind tokens and implement global Framer Motion transitions (e.g., page entrance, sidebar collapse).
5. **API & Data Contracts**: Enforce generic typed response wrappers and implement TanStack Query/Zod for frontend state.

## Checkpoint 3 — Core SOC Operations
1. **Dashboard**: Convert the static dashboard to an operational command center with real Recharts visualizations.
2. **Incidents**: Complete the incident management lifecycle (CRUD, assignment, timeline, evidence) with server-side pagination.
3. **Assets**: Implement actual asset risk calculations and tracking.
4. **SIEM**: Finalize the SIEM integration metrics.
5. **Reports & Audit**: Introduce the durable background report generation engine and virtualized audit logs.

## Checkpoint 4 — Detection and Intelligence
1. **Detection Engineering**: Replace in-memory Sigma rules with a persistent repository, version history, and testing UI.
2. **MITRE ATT&CK**: Populate the coverage heatmap with real data.
3. **Threat Intelligence**: Build robust provider adapters (VirusTotal, AbuseIPDB) with rate limiting and caching.
4. **AI SOC**: Create a provider-agnostic interface with streaming support, prompt logging, and explicit human approval loops for actions.

## Checkpoint 5 — Defensive Integrations
1. **WAF**: Persist WAF events and create the blocking/unblocking UI.
2. **Deception**: Consolidate Honeypot into Deception, showing event timelines and attacker sessions.
3. **Threat Hunting**: Build the query editor and results export mechanism.
4. **Phishing Analysis**: Implement the secure `.eml` upload, parsing, and IOC extraction pipeline without executing payloads.

## Checkpoint 6 — Administration
1. **Notifications**: Establish durable notification events via RabbitMQ and build the in-app drawer.
2. **Administration**: Implement full user CRUD, active sessions viewer, and role management.
3. **Settings**: Create the integration configuration UI ensuring masked secrets.
4. **System Health**: Complete the backend health status APIs (Redis, RabbitMQ, DB).

## Checkpoint 7 — Production Hardening
1. **Event Architecture**: Replace in-memory bus with Celery/RabbitMQ background tasks.
2. **Docker**: Restructure `docker-compose.yml` for production readiness, add `.env.example`, and enforce non-root containers.
3. **Security**: Run comprehensive vulnerability scans, enable rate limiting, and secure Traefik.
4. **Performance & Accessibility**: Ensure WCAG 2.2 AA compliance and Lighthouse score >90.
5. **Testing & CI**: Add frontend tests (Vitest/Playwright), complete backend Pytest suite, and setup CI workflow rules.
