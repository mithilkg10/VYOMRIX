from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List

from app.domains.auth.dependencies import RequirePermissions, get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum

from .schemas import SigmaRule, ValidationResult
from .services import DetectionManager

router = APIRouter(prefix="/detection", tags=["Detection Engineering"])

_manager = DetectionManager()


def get_detection_manager() -> DetectionManager:
    return _manager


@router.get("/rules", response_model=List[SigmaRule])
async def list_rules(
    manager: DetectionManager = Depends(get_detection_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.RULES_READ])),
):
    """List all Sigma rules in the detection library."""
    return await manager.list_rules()


@router.get("/rules/{rule_id}", response_model=SigmaRule)
async def get_rule(
    rule_id: str,
    manager: DetectionManager = Depends(get_detection_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.RULES_READ])),
):
    """Retrieve a specific Sigma rule by ID."""
    rule = await manager.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("/rules/validate", response_model=ValidationResult)
async def validate_rule(
    raw_yaml: str = Body(..., media_type="text/plain"),
    manager: DetectionManager = Depends(get_detection_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.RULES_READ])),
):
    """Validate a raw Sigma rule YAML string without persisting it."""
    return manager.validate_sigma_rule(raw_yaml)


@router.post("/rules", response_model=SigmaRule, status_code=201)
async def create_rule(
    raw_yaml: str = Body(..., media_type="text/plain"),
    manager: DetectionManager = Depends(get_detection_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.RULES_WRITE])),
):
    """Validate and store a new Sigma rule."""
    try:
        return await manager.add_rule(raw_yaml)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: str,
    manager: DetectionManager = Depends(get_detection_manager),
    _: UserModel = Depends(RequirePermissions([PermissionsEnum.RULES_DELETE])),
):
    """Remove a Sigma rule from the detection library."""
    rule = await manager.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    manager._rules.pop(rule_id, None)
