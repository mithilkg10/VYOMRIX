# Vyomrix Feature Matrix

This matrix tracks the completion status of all required routes and capabilities for the Vyomrix v1.0 Enterprise release.

| Route / Capability | Current Status | Required Frontend Work | Required Backend Work | Permissions | Test Coverage | Final Verification |
|--------------------|----------------|------------------------|-----------------------|-------------|---------------|--------------------|
| **Core** | | | | | | |
| `/login` | Partial | Complete UI, TOTP MFA option, Accessible errors | Implement refresh tokens, rate limiting, audit logging | None | 0% | Pending |
| `/forgot-password` | Missing | Build form and accessible error states | Implement reset workflow, email adapter, audit | None | 0% | Pending |
| `/reset-password` | Missing | Build form and validation | Validate token, update password, revoke sessions | None | 0% | Pending |
| `/` (Dashboard) | Partial | Rebuild into command center, real charts, live SSE | Provide aggregated metrics, SLA stats, SSE/WebSocket | `dashboard:read` | 0% | Pending |
| **Operations** | | | | | | |
| `/incidents` | Partial | Server-side pagination, filters, bulk actions | Full CRUD, assignment, status/severity updates, evidence | `incidents:read` | 0% | Pending |
| `/incidents/[id]` | Partial | Investigation workspace, timeline, MITRE mapping | Timeline events, asset/alert links, playbook notes | `incidents:read` | 0% | Pending |
| `/assets` | Partial | Inventory table, risk/coverage filters, bulk tags | Full CRUD, real `last_seen`, risk scores, WAF linkage | `assets:read` | 0% | Pending |
| `/assets/[id]` | Partial | Detail view, risk trend, related alerts/incidents | Asset history, vulnerability summary | `assets:read` | 0% | Pending |
| **SIEM & WAF** | | | | | | |
| `/siem` | Partial | Alert rates, severity trends, agent health | Aggregated metrics, data freshness latency | `siem:read` | 0% | Pending |
| `/siem/alerts` | Partial | Server-side filtering, saved views, bulk actions | Wazuh pagination, search, MITRE mapping | `siem:read` | 0% | Pending |
| `/siem/alerts/[id]` | Partial | Raw JSON viewer, IOC extraction, AI explanation | Alert details, upstream error handling | `siem:read` | 0% | Pending |
| `/siem/agents` | Partial | Status table, health/upgrade status | Agent list API, pagination | `siem:read` | 0% | Pending |
| `/siem/agents/[id]` | Partial | Agent detail, related alerts | Agent detail API | `siem:read` | 0% | Pending |
| `/waf` | Partial | Attack category trend, top IPs, event table | WAF event model, persistence, block/unblock API | `waf:read` | 0% | Pending |
| **Detection & Intel** | | | | | | |
| `/detection` | Partial | Sigma YAML editor, validation, diff viewer | Persistent DB repository, version history, validation | `detection:read` | 0% | Pending |
| `/detection/[id]` | Partial | Detailed rule view, test results, approval | Rule deployment status, test execution API | `detection:read` | 0% | Pending |
| `/threat-intel` | Partial | IOC search workspace, reputation timeline | Provider adapters, caching, rate-limit awareness | `intel:read` | 0% | Pending |
| `/mitre` | Partial | Interactive coverage heat map, technique cards | Tactic coverage metrics, gap analysis API | `mitre:read` | 0% | Pending |
| `/ai-soc` | Partial | Source citations, approval cards, YAML rendering | Provider-agnostic adapter, stream responses, prompt logging | `ai:read` | 0% | Pending |
| **Advanced** | | | | | | |
| `/deception` | Partial | Event list, attacker sessions, sensor health | Event persistence, session grouping, intel enrichment | `deception:read` | 0% | Pending |
| `/hunting` | Placeholder | Query editor, time range, result export | Provider abstraction, paginated results | `hunting:read` | 0% | Pending |
| `/phishing` | Placeholder | `.eml` upload, safe preview, report export | Parse headers/body, extract IOCs, malware scanning | `phishing:read` | 0% | Pending |
| **Management** | | | | | | |
| `/reports` | Partial | Report history, generation status, templates | Durable storage abstraction, background generation | `reports:read` | 0% | Pending |
| `/audit` | Partial | Virtualized audit table, advanced filters | Immutable audit trail, export | `audit:read` | 0% | Pending |
| `/notifications` | Placeholder| Notification drawer, preferences, quiet hours | Durable events, Slack/Teams/Email adapters | `notifications:read`| 0% | Pending |
| `/administration` | Partial | User list, role assignment, active sessions | RBAC enforcement, session revocation API | `admin:read` | 0% | Pending |
| `/settings` | Placeholder | Integration settings, masked secrets | Backend secret storage, connection testing API | `settings:read` | 0% | Pending |
| `/system` | Partial | Granular health workspace, latency, queues | Comprehensive health check APIs (RabbitMQ, Redis) | `system:read` | 0% | Pending |
| `/design-system` | Placeholder | Document all components, tokens, states | N/A | None | 0% | Pending |
