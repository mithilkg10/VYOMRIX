from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_user
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum
from app.domains.incidents.models import IncidentModel
from app.domains.assets.models import AssetModel
from app.domains.detection.models import SigmaRuleModel
from .schemas import SearchResponse, SearchResult

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Max results per category"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    results = []
    user_perms = set(current_user.permissions)
    is_super_admin = PermissionsEnum.ADMIN_ALL.value in user_perms
    
    search_term = f"%{q}%"
    
    # 1. Search Incidents
    if is_super_admin or PermissionsEnum.INCIDENTS_READ.value in user_perms:
        stmt = select(IncidentModel).where(
            or_(
                IncidentModel.id.ilike(search_term),
                IncidentModel.title.ilike(search_term),
                IncidentModel.description.ilike(search_term)
            )
        ).limit(limit)
        inc_res = await db.execute(stmt)
        for inc in inc_res.scalars().all():
            results.append(SearchResult(
                id=inc.id,
                type="incident",
                title=inc.title,
                subtitle=f"{inc.severity} - {inc.status}",
                url=f"/incidents/{inc.id}"
            ))

    # 2. Search Assets
    if is_super_admin or PermissionsEnum.ASSETS_READ.value in user_perms:
        stmt = select(AssetModel).where(
            or_(
                AssetModel.hostname.ilike(search_term),
                AssetModel.ip_address.ilike(search_term),
                AssetModel.id.ilike(search_term)
            )
        ).limit(limit)
        ast_res = await db.execute(stmt)
        for ast in ast_res.scalars().all():
            results.append(SearchResult(
                id=ast.id,
                type="asset",
                title=ast.hostname,
                subtitle=ast.ip_address,
                url=f"/assets/{ast.id}"
            ))

    # 3. Search Rules
    if is_super_admin or PermissionsEnum.RULES_READ.value in user_perms:
        stmt = select(SigmaRuleModel).where(
            or_(
                SigmaRuleModel.title.ilike(search_term),
                SigmaRuleModel.id.ilike(search_term)
            )
        ).limit(limit)
        rule_res = await db.execute(stmt)
        for rule in rule_res.scalars().all():
            results.append(SearchResult(
                id=rule.id,
                type="rule",
                title=rule.title,
                subtitle=f"{rule.level} - {rule.status}",
                url=f"/rules/{rule.id}"
            ))

    # 4. Search Users
    if is_super_admin or PermissionsEnum.USERS_READ.value in user_perms:
        stmt = select(UserModel).where(
            or_(
                UserModel.email.ilike(search_term),
                UserModel.full_name.ilike(search_term),
                UserModel.id.ilike(search_term)
            )
        ).limit(limit)
        user_res = await db.execute(stmt)
        for usr in user_res.scalars().all():
            results.append(SearchResult(
                id=usr.id,
                type="user",
                title=usr.full_name or usr.email,
                subtitle=usr.role,
                url=f"/settings/users/{usr.id}"
            ))
            
    # Sort results to have a mix (could just return as is, since it's grouped by type)
    # The frontend can group them or we can just return them.
    
    return SearchResponse(results=results, total=len(results))
