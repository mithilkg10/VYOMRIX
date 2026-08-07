import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.core.events.bus import event_bus, EventType, Event

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/stream/telemetry")
async def stream_telemetry(request: Request):
    """Real-time Server-Sent Events (SSE) for SOC dashboard telemetry."""
    queue = asyncio.Queue()
    
    async def event_handler(event: Event):
        await queue.put(event)
        
    # Subscribe to all major SOC events
    event_bus.subscribe(EventType.INCIDENT_CREATED, event_handler)
    event_bus.subscribe(EventType.INCIDENT_UPDATED, event_handler)
    event_bus.subscribe(EventType.ALERT_CREATED, event_handler)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event: Event = await asyncio.wait_for(queue.get(), timeout=5.0)
                    yield f"event: {event.event_type.value}\ndata: {event.model_dump_json()}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield ": keepalive\n\n"
        finally:
            event_bus.unsubscribe(EventType.INCIDENT_CREATED, event_handler)
            event_bus.unsubscribe(EventType.INCIDENT_UPDATED, event_handler)
            event_bus.unsubscribe(EventType.ALERT_CREATED, event_handler)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
