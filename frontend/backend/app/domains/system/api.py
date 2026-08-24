import asyncio
import platform
import time

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.events.bus import Event, EventType, event_bus
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

router = APIRouter(prefix="/system", tags=["System"])

_start_time = time.time()


@router.get("/info")
async def system_info(
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.SYSTEM_READ])),
):
    """Return basic system runtime information."""
    uptime_seconds = int(time.time() - _start_time)
    return {
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "uptime_seconds": uptime_seconds,
        "uptime_human": _format_uptime(uptime_seconds),
    }


def _format_uptime(seconds: int) -> str:
    d, rem = divmod(seconds, 86400)
    h, rem = divmod(rem, 3600)
    m, s = divmod(rem, 60)
    parts = []
    if d:
        parts.append(f"{d}d")
    if h:
        parts.append(f"{h}h")
    if m:
        parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)


@router.get("/stream/telemetry")
async def stream_telemetry(
    request: Request,
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.SYSTEM_READ])),
):
    """Real-time SSE stream for SOC dashboard telemetry (all major events)."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=200)

    async def event_handler(event: Event) -> None:
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            pass

    subscribed = [
        EventType.INCIDENT_CREATED,
        EventType.INCIDENT_UPDATED,
        EventType.ALERT_CREATED,
    ]
    for et in subscribed:
        event_bus.subscribe(et, event_handler)

    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event: Event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: {event.event_type.value}\ndata: {event.model_dump_json()}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            for et in subscribed:
                event_bus.unsubscribe(et, event_handler)

    return StreamingResponse(generator(), media_type="text/event-stream")
