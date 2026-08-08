from fastapi import APIRouter, Depends, HTTPException
from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum
from .schemas import ChatRequest, ChatResponse
from .services import AIEngine, AIIntegrationUnavailable

router = APIRouter(prefix="/ai", tags=["AI Security Intelligence"])

def get_ai_engine() -> AIEngine:
    return AIEngine()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    engine: AIEngine = Depends(get_ai_engine),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.AI_SOC_QUERY]))
):
    """
    Interact with the Vyomrix AI Security Intelligence Platform.
    Requires structured context and agent role.
    """
    try:
        return await engine.chat(request)
    except AIIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail="AI services are not configured.") from exc
