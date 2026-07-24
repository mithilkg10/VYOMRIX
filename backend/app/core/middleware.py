import time
import uuid
import asyncio
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt
from app.core.database import AsyncSessionLocal
from app.domains.audit.services import audit_service
from app.domains.audit.schemas import AuditLogCreate
from app.core.config import settings

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We only want to log mutations (POST, PUT, DELETE, PATCH)
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            start_time = time.time()
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Determine user if possible (from Authorization header)
            user_email = "anonymous"
            if "authorization" in request.headers:
                token = request.headers.get("authorization").replace("Bearer ", "")
                # Assuming auth_service can decode this without DB if using jwt
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                    user_email = payload.get("sub", "unknown")
                except Exception:
                    pass

            # Log the action asynchronously so we don't block the response
            action = f"{request.method} {request.url.path}"
            result = f"{response.status_code}"
            
            if response.status_code >= 400:
                result = f"Failed ({response.status_code})"
            else:
                result = f"Success ({response.status_code})"

            audit_log_data = AuditLogCreate(
                user_email=user_email,
                action=action,
                target=request.url.path,
                resource_id=None,  # Extracting resource ID generically is hard, we leave None
                ip_address=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent", "unknown"),
                result=result
            )

            # Fire and forget audit log creation
            asyncio.create_task(self.log_async(audit_log_data))
            
            return response
        else:
            return await call_next(request)

    async def log_async(self, log_data: AuditLogCreate):
        async with AsyncSessionLocal() as session:
            await audit_service.create_log(session, log_data)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Exception: cdn.jsdelivr.net and fastapitiangolo.tiangolo.com are required for FastAPI's auto-generated Swagger UI to load its JS/CSS/Images.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "img-src 'self' data: fastapitiangolo.tiangolo.com;"
        )
        return response
