# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-23

### Added
- Complete Enterprise SIEM platform with active Threat Intelligence correlation.
- Fully-functional asynchronous Event Bus with dead-letter queuing and retry policies.
- Deep MITRE ATT&CK Framework integrations for behavioral mapping.
- JWT-based authentication with Refresh Tokens and Account Lockout defense.
- RBAC security enforced across all API endpoints (Super Admin, Analyst, etc.).
- Robust UI components built with React and `shadcn/ui`.
- Automated PostgreSQL entity seeding (`db_seeder.py`) and schema migrations (`alembic`).
- Full containerization (`docker compose`) for reproducible deployments.

### Changed
- Migrated all Backend Domains (Assets, Incidents, MITRE) to the Repository Pattern to decouple business logic from the ORM.
- Hardened HTTP headers via `SecurityHeadersMiddleware`.
- Updated `.dockerignore` for significant reduction in frontend build context latency.

### Removed
- All legacy mock dictionaries from early development phases.
