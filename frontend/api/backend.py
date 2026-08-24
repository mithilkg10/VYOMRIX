import os
import sys
import asyncio
import secrets
from pathlib import Path

# Vercel-hosted showcase runtime. The original backend remains unchanged at repo root.
os.environ.setdefault("VYOMRIX_RUNTIME", "local")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("VYOMRIX_SANDBOX", "false")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "240")

BACKEND_ROOT = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from app.main import app as backend_app
from app.core.database import Base, engine
from app.core.bootstrap import bootstrap_system
from app.core.security_store import init_security_store
from app.core.events.bus import event_bus

app = FastAPI(title="Vyomrix Vercel Backend Dispatcher", docs_url=None, redoc_url=None)

_initialized = False
_init_lock = asyncio.Lock()


async def ensure_backend_ready() -> None:
    global _initialized
    if _initialized:
        return

    async with _init_lock:
        if _initialized:
            return

        # Vercel functions have writable ephemeral storage only under /tmp.
        # Build the real VYOMRIX SQLAlchemy schema there for the hosted showcase.
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        await bootstrap_system()
        await init_security_store()
        event_bus.initialize("local")
        await event_bus.start(is_worker=False)
        _initialized = True


@app.api_route(
    "/api/backend",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def backend_dispatch(request: Request) -> Response:
    backend_path = request.query_params.get("backend_path")
    if not backend_path:
        return JSONResponse(
            {
                "status": "ok",
                "runtime": "python",
                "service": "vyomrix-fastapi",
                "mode": "vercel-showcase",
            }
        )

    if not backend_path.startswith("/api/v1") and backend_path != "/metrics":
        return JSONResponse({"detail": "Unsupported backend path"}, status_code=400)

    try:
        await ensure_backend_ready()
    except Exception as exc:
        print(f"Vyomrix backend initialization failed: {exc!r}")
        return JSONResponse(
            {"detail": "Backend initialization failed", "type": type(exc).__name__},
            status_code=503,
        )

    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "connection", "content-length", "transfer-encoding"}
    }

    # Browser API calls carry the access token in the secure HttpOnly cookie.
    # The original FastAPI dependency expects a Bearer token, so bridge it here.
    if "authorization" not in {key.lower() for key in headers}:
        access_token = request.cookies.get("access_token")
        if access_token:
            headers["authorization"] = f"Bearer {access_token}"

    # Keep browser state-changing requests protected by the existing CSRF cookie/header pair.
    if request.method not in {"GET", "HEAD", "OPTIONS"} and request.cookies.get("access_token"):
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("x-csrf-token")
        if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
            return JSONResponse({"detail": "CSRF token mismatch"}, status_code=403)

    forwarded_params = [
        (key, value)
        for key, value in request.query_params.multi_items()
        if key != "backend_path"
    ]
    body = await request.body()

    transport = httpx.ASGITransport(app=backend_app)
    try:
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://vyomrix-backend",
            follow_redirects=True,
            timeout=30.0,
        ) as client:
            upstream = await client.request(
                request.method,
                backend_path,
                params=forwarded_params,
                headers=headers,
                content=body,
            )
    except Exception as exc:
        print(f"Vyomrix backend request failed: {exc!r}")
        return JSONResponse(
            {"detail": "Backend request failed", "type": type(exc).__name__},
            status_code=502,
        )

    response_headers = {"Cache-Control": "no-store"}
    for key in ("content-type", "content-disposition"):
        if key in upstream.headers:
            response_headers[key] = upstream.headers[key]

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )
