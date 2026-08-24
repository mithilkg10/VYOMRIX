import pytest
import asyncio
from datetime import datetime, timedelta, timezone
import sqlalchemy as sa
from app.domains.auth.services import AuthService
from app.domains.auth.models import UserModel, RefreshSessionModel

@pytest.mark.asyncio
async def test_password_recovery_flow(db_session, setup_test_user):
    auth_service = AuthService()
    user = setup_test_user
    original_password_hash = user.hashed_password
    
    # 1. Unknown email receives enumeration-safe response
    # We will test the API endpoint later, but for the service:
    token_none = await auth_service.generate_password_reset_token(db_session, "unknown@example.com")
    assert token_none is None
    
    # 2. Secure random token generation is used
    tokens = [await auth_service.generate_password_reset_token(db_session, user.email) for _ in range(5)]
    
    # Ensure distinct across representative sample
    assert len(set(tokens)) == 5
    token = tokens[-1]
    
    # 3. Only the token hash is stored
    db_session.expire_all()
    user_db = await db_session.get(UserModel, user.id)
    assert user_db.reset_token_hash is not None
    assert user_db.reset_token_hash != token
    assert str(token) not in user_db.reset_token_hash
    
    # 4. Create an existing session to ensure it gets revoked
    session_data = await auth_service.create_refresh_session(db_session, user.id, "127.0.0.1", "Test-Agent")
    assert session_data is not None
    
    # 5. Invalid token is rejected
    success_invalid = await auth_service.reset_password_with_token(db_session, "invalid_token_123", "NewP@ssw0rd!")
    assert success_invalid is False
    
    # 6. Password changes successfully
    new_password = "NewP@ssw0rd123!"
    success = await auth_service.reset_password_with_token(db_session, token, new_password)
    assert success is True
    
    # 7. Token is single-use / used token is rejected
    success_reuse = await auth_service.reset_password_with_token(db_session, token, "AnotherPass123!")
    assert success_reuse is False
    
    # 8. Old password fails afterwards
    user_after_fetch = await auth_service.get_user_by_email(db_session, user.email)
    assert not auth_service.verify_password("TestPassword123!", user_after_fetch.hashed_password)
    
    # 9. New password works
    assert auth_service.verify_password(new_password, user_after_fetch.hashed_password)
    
    # 10. Existing sessions are revoked
    db_session.expire_all()
    session_result = await db_session.execute(sa.select(RefreshSessionModel).where(RefreshSessionModel.id == session_data["session_id"]))
    session_db = session_result.scalars().first()
    assert session_db.revoked_at is not None
    assert session_db.revocation_reason == "password_reset"
    
@pytest.mark.asyncio
async def test_password_recovery_expiry(db_session, setup_test_user):
    auth_service = AuthService()
    user = setup_test_user
    
    token = await auth_service.generate_password_reset_token(db_session, user.email)
    assert token is not None
    
    # Expire the token manually
    await db_session.execute(
        sa.update(UserModel)
        .where(UserModel.id == user.id)
        .values(reset_token_expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2))
    )
    await db_session.commit()
    
    # 11. Token expires
    success = await auth_service.reset_password_with_token(db_session, token, "NewP@ssw0rd!")
    assert success is False
