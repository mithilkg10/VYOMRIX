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

    # API Routers
    app.include_router(health_api.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
    app.include_router(siem_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(ti_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(ai_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(deception_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(waf_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(assets_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(detection_api.router, prefix=f"{settings.API_V1_STR}")
    app.include_router(mitre_api.router, prefix=f"{settings.API_V1_STR}")

    return app

app = create_app()
