from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def health_check():
    return {
        "status": "ok",
        "service": "Vyorix Backend API",
        "version": "1.0.0"
    }
