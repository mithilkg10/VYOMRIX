from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.domains.health import api as health_api
from app.domains.siem import api as siem_api
from app.domains.threat_intel import api as ti_api
from app.domains.ai import api as ai_api
from app.domains.deception import api as deception_api
from app.domains.waf import api as waf_api
from app.domains.assets import api as assets_api
from app.domains.detection import api as detection_api
from app.domains.mitre import api as mitre_api
from app.domains.incidents import api as incidents_api
from app.domains.reports import api as reports_api
from app.domains.auth import api as auth_api
from app.domains.auth.dependencies import get_current_user
from app.domains.audit import api as audit_api
from app.domains.notifications.services import notification_service
from app.core.middleware import AuditMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import Depends

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        description="Enterprise Cybersecurity Platform API",
        version="1.0.0"
    )

    # Security Middleware (CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # In production, restrict to frontend domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security Headers Middleware
    from app.core.middleware import SecurityHeadersMiddleware
    app.add_middleware(SecurityHeadersMiddleware)

    # Audit Middleware
    app.add_middleware(AuditMiddleware)

    # API Routers
    app.include_router(health_api.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
    app.include_router(auth_api.router, prefix=f"{settings.API_V1_STR}")
    
    # Protected Routers
    protected_depends = [Depends(get_current_user)]
    app.include_router(siem_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(ti_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(ai_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(deception_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(waf_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(assets_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(detection_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(mitre_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(incidents_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(reports_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)
    app.include_router(audit_api.router, prefix=f"{settings.API_V1_STR}", dependencies=protected_depends)

    @app.get(f"{settings.API_V1_STR}")
    async def api_root():
        return {
            "name": "MKG SOC Platform",
            "codename": "Vyomrix",
            "version": "1.0.0",
            "status": "healthy",
            "environment": settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else "development",
            "documentation": f"{settings.API_V1_STR}/docs"
        }

    # Prometheus Instrumentation
    Instrumentator().instrument(app).expose(app)

    return app

app = create_app()
