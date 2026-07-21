import json
import logging
import time
import uuid
from typing import Dict, Any, Optional
from .schemas import ChatRequest, ChatResponse, AIResponseModel, AgentRole
from .providers import AIProvider, GeminiProvider, OpenAIProvider
from app.core.config import settings
from app.core.prompts.templates import SYSTEM_PROMPTS, build_context_prompt

logger = logging.getLogger(__name__)

class AIEngine:
    def __init__(self):
        # In a real setup, select provider based on config.
        # Defaulting to GeminiProvider for Vyomrix.
        # Fallback to OpenAI if Gemini fails.
        self.primary_provider = GeminiProvider(api_key=settings.GEMINI_API_KEY if hasattr(settings, 'GEMINI_API_KEY') else "dummy")
        
    async def chat(self, request: ChatRequest) -> ChatResponse:
        start_time = time.time()
        
        system_prompt = SYSTEM_PROMPTS.get(request.role.value, SYSTEM_PROMPTS["security_assistant"])
        full_prompt = build_context_prompt(request.message, request.context_data)
        
        # Combine system prompt and user prompt (Providers handle this differently, 
        # but for simplicity we inject it here).
        final_prompt = f"{system_prompt}\n\n{full_prompt}"
        
        raw_response = ""
        structured_response = None
        
        try:
            raw_response = await self.primary_provider.generate_response(final_prompt)
            
            # Extract JSON block if surrounded by markdown code blocks
            json_text = raw_response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].strip()
                
            data = json.loads(json_text)
            structured_response = AIResponseModel(**data)
            
        except Exception as e:
            logger.error(f"AI response parsing failed: {e}")
            # Fallback to a basic structured response if parsing fails
            structured_response = AIResponseModel(
                summary="AI generation succeeded, but structured parsing failed.",
                risk_level="Unknown",
                confidence=0,
                mitre_attack=[],
                indicators=[],
                recommended_actions=["Review raw response text below."]
            )
            
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            role=request.role,
            response=structured_response,
            raw_text=raw_response,
            processing_time_ms=processing_time_ms
        )
