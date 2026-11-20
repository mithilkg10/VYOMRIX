# VYOMRIX

**Live demo:** https://vyomrix.vercel.app/login and choose **Open recruiter demo**. No account is needed.

VYOMRIX is a detection and response platform I built to show the whole path a SOC analyst works through: raw telemetry, detection, correlation, triage, investigation, containment and reporting. The hosted demo runs a real detection engine in your browser against a simulated lab network, so you can launch an attack, watch which rules catch each step and stop it before it reaches the file server.

[Portfolio case study](https://mithilkg-portfolio.vercel.app/projects/vyomrix-security-platform) · [Cyber Defense Lab investigations](https://github.com/mithilkg10/MKG-Cyber-Defense-Lab)

## What to try in five minutes

1. Open the **Attack Lab** and launch *Phishing to ransomware staging*. Every step shows the rule that caught it and how long detection took.
2. Launch it again, and as soon as the first critical alert fires, disable `CORP\svc_backup` from the Respond panel. The PsExec step now fails with a refused logon and the rest of the chain never runs.
3. Launch *Web application compromise*. The staging WAF is in detection only mode, so the injection succeeds. Switch it to blocking on the **Web Firewall** page and run it again.
4. Open the incident, look at the process tree (the encoded PowerShell is decoded inline), add a note, run the containment playbook and download the PDF report.
5. In **Detections**, open any rule, click *Edit in playground*, change a value and run it against every event in memory.

## How it works

```text
 telemetry generator          one fixed seed per second of time, so history is stable
  Sysmon, Windows Security,   plus three scripted attack scenarios that only emit raw events
  auditd, sshd, nginx, DNS,
  Cowrie honeypot
          |
          v
 ingestion ---> WAF (CRS style anomaly scoring) ---> intel matcher (IPs, domains, URLs, hashes)
          |
          v
 Sigma engine: 39 rules compiled from YAML by an in house parser
          |    single event rules, then Sigma v2 correlations
          |    (event_count, value_count, temporal_ordered)
          v
 alerts (deduplicated) ---> incidents (grouped by shared host, user or address)
          |
          v
 analyst actions: triage, isolate, block, disable, WAF mode
   journalled, replayed on reload, hash chained into the audit log
```

* **Sigma compiler.** `frontend/src/lib/engine/sigma.ts` supports selections as maps and lists, keywords, wildcards, the modifiers `contains`, `startswith`, `endswith`, `all`, `re`, `cidr`, `gt`, `gte`, `lt`, `lte`, `exists`, `windash`, `wide`, `base64` and `base64offset`, and full condition expressions. The encoded PowerShell rule matches the UTF16 base64 form of `DownloadString` at every byte offset without decoding anything.
* **Correlation.** Building block rules (failed logons, failed SSH passwords, long DNS labels) feed counting and ordered sequence rules, which is how brute force followed by a successful logon is caught.
* **WAF.** Rules are modelled on OWASP CRS at paranoia level 1, with repeated URL decoding, entity decoding and comment stripping before matching.
* **Response changes the world.** Isolation, edge blocks, disabled accounts and WAF mode are checked by the attack scenarios, so a response action really prevents the later steps instead of just changing a label.
* **Determinism.** Analyst decisions are stored as a journal. A reload replays the same seconds and the same decisions and ends with identical alert ids, incidents and audit hashes.

Telemetry is synthetic and every indicator uses the RFC 5737 documentation ranges or the reserved `.example` domain. The detection logic is real.

## Detection content and parity tests

The rules live as plain YAML in `detection_content/sigma`. The same files are compiled by two independent evaluators:

* TypeScript in the browser engine
* Python in `backend/app/domains/detection/sigma_engine.py`, used by the backend `DetectionManager`

`backend/tests_detection` holds 593 events exported from the browser engine (every attack step plus a sample of background noise) with the rules TypeScript matched. The Python suite must reach the same verdict on every one of them.

```bash
cd backend && python -m pytest tests_detection        # 599 tests
cd frontend && npm run test                           # engine, compiler, WAF and hunting tests
cd frontend && npm run export:detection               # regenerate the YAML and parity fixtures
```

## Console

| Page | What it does |
| --- | --- |
| Overview | Live threat radar, telemetry and alert volume, mean time to detect and contain, raw event stream |
| Attack Lab | Three kill chains with per step detection results and an inline Respond panel |
| Incidents | Timeline, process tree, evidence, entities, containment playbook, notes |
| Alert Queue | Triage with true positive, false positive and benign verdicts that feed rule precision |
| Detections | Rule library with hits, alerts and precision, plus the Sigma playground |
| Threat Hunting | Query language with field matching, wildcards, comparisons, AND, OR, NOT and parentheses |
| ATT&CK Coverage | Coverage worked out from rule tags, with gaps left visible |
| Web Firewall | Per host blocking or detection mode, request tester, edge block list |
| Threat Intel | Indicator store, lookup across the event store and the honeypot |
| Deception | Honeypot sources, credential statistics and session replay |
| Assets, Reports, Audit Log | Host risk and isolation, PDF and JSON reports, chain verification |

Light and dark themes are both fully supported.

## Running the full stack locally

The hosted demo needs nothing but the frontend. The full platform also has a FastAPI backend with PostgreSQL, Redis and optional Wazuh integration.

```bash
cp .env.example .env && cp .env.example backend/.env
docker-compose up -d postgres redis
cd backend && pip install -r requirements.txt && python -m alembic upgrade head && uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev
```

Recruiter sessions are short lived signed HttpOnly cookies (`DEMO_SESSION_SECRET`, at least 32 characters). The owner login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` from runtime secrets. Nothing secret is committed.

## Technology

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, FastAPI, PostgreSQL, Redis, Pytest, Vitest and Playwright.

## Repository layout

* `frontend/src/lib/engine`: detection engine, scenarios, WAF, intel, hunting language, PDF writer
* `frontend/src/app/(dashboard)`: console pages
* `detection_content/sigma`: shared rule content
* `backend/app/domains`: FastAPI services, including the Python Sigma evaluator
* `docs/project`: earlier planning and release notes
