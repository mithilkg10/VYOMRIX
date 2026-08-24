import logging
from .schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

class AIIntegrationUnavailable(Exception):
    """Raised when no production AI provider is implemented and configured."""


class AIEngine:
    async def chat(self, request: ChatRequest) -> ChatResponse:
        del request
        logger.warning("AI chat requested while no production provider is available")
        raise AIIntegrationUnavailable()
