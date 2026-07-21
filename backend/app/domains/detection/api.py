from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from .schemas import SigmaRule, ValidationResult
from .services import DetectionManager

router = APIRouter(prefix="/detection", tags=["Detection Engineering"])

_manager = DetectionManager()

def get_detection_manager() -> DetectionManager:
    return _manager

@router.get("/rules", response_model=List[SigmaRule])
async def list_rules(manager: DetectionManager = Depends(get_detection_manager)):
    """List all Sigma rules in the detection library."""
    return await manager.list_rules()

@router.post("/rules/validate", response_model=ValidationResult)
async def validate_rule(
    raw_yaml: str = Body(..., media_type="text/plain"),
    manager: DetectionManager = Depends(get_detection_manager)
):
    """Validate a raw Sigma rule YAML string without saving it."""
    return manager.validate_sigma_rule(raw_yaml)

@router.post("/rules", response_model=SigmaRule)
async def create_rule(
    raw_yaml: str = Body(..., media_type="text/plain"),
    manager: DetectionManager = Depends(get_detection_manager)
):
    """Validate and store a new Sigma rule."""
    try:
        return await manager.add_rule(raw_yaml)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
