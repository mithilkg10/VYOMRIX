import secrets

import pytest
from sqlalchemy import select

from app.core.bootstrap import bootstrap_system
from app.core.config import settings
from app.domains.auth.models import UserModel
from app.domains.auth.permissions import PermissionsEnum, RoleEnum
from app.domains.auth.services import AuthService


@pytest.mark.asyncio
async def test_explicit_owner_and_demo_bootstrap_is_idempotent(db_session, monkeypatch):
    owner_email = "owner-bootstrap-test@example.invalid"
    owner_password = secrets.token_urlsafe(24) + "A1!"
    demo_password = secrets.token_urlsafe(24) + "A1!"
    monkeypatch.setattr(settings, "ADMIN_EMAIL", owner_email)
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", AuthService().get_password_hash(owner_password))
    monkeypatch.setattr(settings, "DEMO_PASSWORD", demo_password)
    monkeypatch.setattr(settings, "DEMO_DATA_ONLY", True)

    await bootstrap_system()
    await bootstrap_system()
    db_session.expire_all()

    owner = await db_session.scalar(select(UserModel).where(UserModel.email == owner_email))
    demo = await db_session.scalar(select(UserModel).where(UserModel.email == "demo.analyst@mithilkg.dev"))
    assert owner and owner.role == RoleEnum.SUPER_ADMIN.value
    assert owner.permissions == [PermissionsEnum.ADMIN_ALL.value]
    assert AuthService().verify_password(owner_password, owner.hashed_password)
    assert demo and demo.role == RoleEnum.SOC_ANALYST.value
    assert demo.permissions
    assert all(permission.endswith(":read") for permission in demo.permissions)
    assert AuthService().verify_password(demo_password, demo.hashed_password)
