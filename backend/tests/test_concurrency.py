import pytest
import asyncio
from datetime import datetime, timedelta
from app.domains.auth.services import AuthService
from app.domains.auth.models import RefreshSessionModel

@pytest.mark.asyncio
async def test_concurrent_token_refresh(db_session, setup_test_user):
    """
    Test 5 simultaneous requests. 1 should succeed with a new token (or all get the SAME new token because of the 5-second grace period!).
    This proves idempotent refresh and exactly one successor generation.
    """
    auth_service = AuthService()
    user = setup_test_user
    import sqlalchemy as sa
    from sqlalchemy import text
    
    # 1. Create a baseline refresh session
    session_data = await auth_service.create_refresh_session(db_session, user.id, "127.0.0.1", "Test-Agent")
    original_jti = session_data["jti"]
    family_id = session_data["family_id"]
    
    # 2. Simulate 5 concurrent requests to rotate the token
    from app.core.database import AsyncSessionLocal
    
    async def attempt_refresh():
        async with AsyncSessionLocal() as session:
            return await auth_service.rotate_refresh_token(session, original_jti, family_id)
            
    # Run 5 concurrent rotations
    import asyncio
    results = await asyncio.gather(*[attempt_refresh() for _ in range(5)], return_exceptions=True)
    
    # Analyze results
    successes = [r for r in results if isinstance(r, dict)]
    
    # With the 5-second grace period, ALL 5 requests should succeed!
    assert len(successes) == 5, f"Expected 5 successes due to grace period, got {len(successes)}"
    
    # 3. Assert exact database state for exactly ONE successor
    db_session.expire_all()
    sessions_result = await db_session.execute(sa.select(RefreshSessionModel).where(RefreshSessionModel.family_id == family_id))
    sessions = sessions_result.scalars().all()
    
    # There should only be TWO sessions total: the original parent, and the ONE successor.
    assert len(sessions) == 2, "There must be exactly one parent and exactly one successor session in the family."
    
    parent = next(s for s in sessions if s.jti == original_jti)
    successor = next(s for s in sessions if s.jti != original_jti)
    
    # The parent has exactly one replacement identifier
    assert parent.replacement_jti == successor.jti, "Parent replacement_jti must explicitly point to the single successor."
    # Exactly one parent-to-successor relation exists
    assert successor.parent_jti == parent.jti, "Successor must point back to the exact parent JTI."
    # Legitimate concurrency does not revoke the family
    assert parent.revoked_at is None, "Legitimate concurrency must NOT revoke the parent (except via rotation mechanism)."
    assert successor.revoked_at is None, "Successor must be completely valid."
    
    # Duplicate requests receive credentials for the SAME successor
    jti_set = {s["jti"] for s in successes}
    assert len(jti_set) == 1, "All concurrent requests must receive the same JTI"
    assert list(jti_set)[0] == successor.jti, "The returned JTI must match the single database successor JTI."
    
    # Use the returned JTI for the replay test
    res1 = successes[0]
    new_jti = res1["jti"]
    
    # 4. Genuine Replay Detection (outside grace window)
    # Manually backdate the created_at of ALL sessions in the family to simulate a replay AFTER the grace period
    await db_session.execute(
        sa.update(RefreshSessionModel)
        .where(RefreshSessionModel.family_id == family_id)
        .values(created_at=RefreshSessionModel.created_at - timedelta(seconds=10))
    )
    await db_session.commit()
    db_session.expire_all()
    
    # Replay attack outside grace period using the original JTI
    res3 = await auth_service.rotate_refresh_token(db_session, original_jti, family_id)
    assert res3 is None
    
    # Genuine replay MUST revoke the family
    db_session.expire_all()
    sessions_after_replay = await db_session.execute(sa.select(RefreshSessionModel).where(RefreshSessionModel.family_id == family_id))
    for s in sessions_after_replay.scalars().all():
        assert s.revoked_at is not None, "Genuine replay must revoke all tokens in the family."
        assert s.revocation_reason == "replay_detected", "Revocation reason must be clearly labeled."

import httpx
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_concurrent_api_refresh(db_session, setup_test_user):
    from app.main import app
    from app.domains.auth.services import AuthService
    
    # We need an active session to test refresh
    auth_service = AuthService()
    session_data = await auth_service.create_refresh_session(db_session, setup_test_user.id)
    refresh_token = auth_service.create_refresh_token(
        data={"sub": setup_test_user.email},
        jti=session_data["jti"],
        family_id=session_data["family_id"]
    )
    
    # Send 5 concurrent requests to the real API endpoint using AsyncClient
    # httpx.AsyncClient supports ASGI apps directly via transport=httpx.ASGITransport(app=app)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        async def make_request():
            return await client.post("/api/v1/auth/refresh", params={"refresh_token": refresh_token})
            
        results = await asyncio.gather(*[make_request() for _ in range(5)], return_exceptions=True)
        
    successes = [r.json() for r in results if isinstance(r, httpx.Response) and r.status_code == 200]
    
    # 5-second grace window means ALL should succeed
    assert len(successes) == 5, f"Expected 5 successful API responses, got {len(successes)}"
    
    # Check that they received the EXACT identically encoded JWT strings!
    access_tokens = {s["access_token"] for s in successes}
    refresh_tokens = {s["refresh_token"] for s in successes}
    
    assert len(access_tokens) == 1, "All concurrent requests must receive identically encoded access tokens"
    assert len(refresh_tokens) == 1, "All concurrent requests must receive identically encoded refresh tokens"
