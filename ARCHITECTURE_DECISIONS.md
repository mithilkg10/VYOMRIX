# Vyomrix Architecture Decisions

## 1. Application Shell & Routing
- **Framework**: Next.js 16 (App Router) for the frontend, optimizing route transitions, prefetching, and nested layouts.
- **Routing**: Explicit routes for all SOC operations. No "Coming soon" pages. All routes will have a functional, testable implementation.
- **Styling**: TailwindCSS with custom design system tokens, `shadcn/ui` components for rapid, accessible UI development.

## 2. API & Data Contracts
- **Backend Framework**: FastAPI (Python) enforcing strict Pydantic schemas.
- **Data Access**: Repository pattern over SQLAlchemy Async, separating ORM models from business logic.
- **Communication**: Frontend communicates with the backend via a Next.js API proxy to avoid cross-origin (CORS) complexities in the client and manage authentication securely.

## 3. Authentication & Security
- **Auth Strategy**: JWT access tokens stored in memory/context, HTTP-only secure cookies for refresh tokens.
- **RBAC**: Enforced strictly at the API endpoint level and conditionally rendered on the frontend.
- **Cryptography**: Secure hashing (bcrypt) for passwords.
- **Environment**: Strict isolation of secrets. Frontend receives no sensitive configuration. 

## 4. Event Architecture
- **Message Broker**: RabbitMQ for reliable, durable background events (e.g., alert processing, report generation).
- **Caching & State**: Redis for rate limiting, session revocation checks, and real-time state tracking.
- **Worker**: Dedicated async workers process queues idempotently.

## 5. UI/UX & Motion
- **Design System**: "CyberFusion XDR" theme. Dark-mode first with high contrast.
- **Motion**: Framer Motion for micro-interactions (e.g., drawers, page transitions) keeping them performant (120-240ms duration).
- **Accessibility**: WCAG 2.2 AA target. Semantic HTML, ARIA attributes, keyboard support, focus management.

## 6. Real-time & Observability
- **Real-time Data**: Server-Sent Events (SSE) or WebSockets for live dashboard updates, rather than aggressive polling.
- **Logging**: Structured JSON logging on the backend.
- **System Health**: Prometheus-compatible metrics endpoint and granular status endpoints for dependencies (DB, Redis, RabbitMQ).

## 7. Sandbox Mode
- **Designation**: Activated exclusively by an environment variable.
- **Data Source**: A distinct seeded dataset providing realistic (but safe) operational data for demonstrations without exposing real intelligence or credentials.

## 8. Deployment & CI/CD
- **Containerization**: Multi-stage Docker builds with non-root execution.
- **Orchestration**: Docker Compose for robust service orchestration.
- **CI Pipelines**: Required automated gates (linting, type-checking, backend Pytest, frontend Vitest/Playwright).
