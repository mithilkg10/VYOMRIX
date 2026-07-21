from fastapi import APIRouter, Depends
from .schemas import ChatRequest, ChatResponse
from .services import AIEngine

router = APIRouter(prefix="/ai", tags=["AI Security Intelligence"])

def get_ai_engine() -> AIEngine:
    return AIEngine()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    engine: AIEngine = Depends(get_ai_engine)
):
    """
    Interact with the Vyomrix AI Security Intelligence Platform.
    Requires structured context and agent role.
    """
    return await engine.chat(request)
