# Architecture Overview: Vyorix Security Platform

## High-Level Design

Vyorix is built using a modern decoupled architecture. The frontend is a Next.js application that provides a unified, real-time dashboard for security analysts. It communicates via REST and WebSockets with a FastAPI backend. The backend acts as the central nervous system, interfacing with multiple specialized security engines and databases.

### 1. Presentation Layer (Frontend)
- **Framework:** Next.js with React
- **Styling:** Tailwind CSS, shadcn/ui, Framer Motion
- **State Management:** TanStack Query (React Query) for API caching and real-time data sync.
- **Data Visualization:** Recharts, D3.js, React Flow (for incident and MITRE graphing).

### 2. Application Layer (Backend)
- **Framework:** FastAPI (Python 3.10+)
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).
- **Task Queue:** Celery with Redis as the broker for async jobs (e.g., threat intel lookups, AI processing).
- **AI Integration:** LangChain orchestrating Google Gemini API for the AI SOC and Phishing Analyzer modules.

### 3. Data Layer
- **Relational DB:** PostgreSQL (Stores users, incidents, configurations, playbooks).
- **Cache/Broker:** Redis (Session management, rate limiting, Celery queue).
- **Security Data:** Wazuh Indexer / Elasticsearch (Stores raw logs, alerts, vulnerabilities).

### 4. Security Engines & Modules
- **SIEM:** Wazuh Manager (Collects logs from agents, runs rule-based detection).
- **Honeypot:** OpenCanary (Simulates services like SSH, FTP, SMB to capture reconnaissance).
- **WAF:** SafeLine / ModSecurity (Reverse proxies web traffic and blocks malicious requests based on OWASP CRS).
- **Threat Intel:** Integrations with VirusTotal, AbuseIPDB, AlienVault OTX, and CVE/NVD databases.

### 5. Infrastructure & Deployment
- **Orchestration:** Docker Compose.
- **Reverse Proxy:** Traefik (Handles TLS termination, routing to frontend, backend, and security dashboards).
- **CI/CD:** GitHub Actions (Linting, Pytest, CodeQL, Docker builds).

## Network Topology
All services run within an isolated Docker network (`vyorix-network`). Traefik sits at the edge, listening on ports 80 and 443, and routes incoming traffic based on subdomains or paths to the appropriate internal container. Database and engine ports are not exposed directly to the host, ensuring security.
