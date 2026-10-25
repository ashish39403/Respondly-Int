from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from respondly_api.db.connection import connection
from respondly_api.main import create_app
from respondly_api.modules.identity import accounts, routes


def _client() -> TestClient:
    return TestClient(create_app())


def test_missing_token_is_refused() -> None:
    client = _client()
    assert client.post("/accounts").status_code == 401
    assert client.post("/accounts").json()["error"] == "invalid_token"
    assert client.post("/identity/second-method").status_code == 401


def test_invalid_token_is_refused() -> None:
    response = _client().post("/accounts", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401
    assert response.json()["error"] == "invalid_token"


def test_unverified_token_does_not_write(monkeypatch) -> None:
    account_id = str(uuid4())
    monkeypatch.setattr(
        routes,
        "verify_token",
        lambda _token: {
            "sub": account_id,
            "email": "unverified@example.com",
            "name": "Unverified",
            "emailVerified": False,
        },
    )

    response = _client().post("/accounts", headers={"Authorization": "Bearer test"})

    assert response.status_code == 403
    assert response.json()["error"] == "email_unverified"
    with connection() as conn:
        found = conn.execute(
            "SELECT 1 FROM app.accounts WHERE id = %s",
            (account_id,),
        ).fetchone()
    assert found is None


def test_upsert_is_idempotent_and_keeps_verified_time(monkeypatch) -> None:
    account_id = str(uuid4())
    monkeypatch.setattr(
        routes,
        "verify_token",
        lambda _token: {
            "sub": account_id,
            "email": "ready@example.com",
            "name": "Ready Person",
            "emailVerified": True,
        },
    )
    client = _client()
    headers = {"Authorization": "Bearer test"}

    try:
        first = client.post("/accounts", headers=headers)
        second = client.post("/accounts", headers=headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["account_id"] == account_id
        assert second.json()["verified_at"] == first.json()["verified_at"]
        assert second.json()["name"] == "Ready Person"
        with connection() as conn:
            count = conn.execute(
                "SELECT count(*) AS n FROM app.accounts WHERE id = %s",
                (account_id,),
            ).fetchone()
        assert count is not None
        assert count["n"] == 1
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM app.accounts WHERE id = %s", (account_id,))


def test_failed_write_stays_an_error(monkeypatch) -> None:
    monkeypatch.setattr(
        routes,
        "verify_token",
        lambda _token: {
            "sub": str(uuid4()),
            "email": "retry@example.com",
            "name": "Retry",
            "emailVerified": True,
        },
    )

    def explode(*_args, **_kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(routes, "upsert_account", explode)
    response = _client().post("/accounts", headers={"Authorization": "Bearer test"})
    assert response.status_code == 500
    assert response.json()["error"] == "account_not_saved"


def test_unknown_email_status() -> None:
    response = _client().post(
        "/identity/email-status",
        json={"email": f"missing-{uuid4()}@example.com"},
    )
    assert response.status_code == 200
    assert response.json() == {"kind": "unknown"}


def test_provider_check_and_google_refusal() -> None:
    user_id = uuid4()
    email = f"link-{user_id}@example.com"
    now = datetime.now(UTC)
    with connection() as conn:
        conn.execute(
            """
            INSERT INTO neon_auth."user"
                (id, name, email, "emailVerified", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, true, %s, %s)
            """,
            (user_id, "Link Test", email, now, now),
        )
        conn.execute(
            """
            INSERT INTO neon_auth.account
                (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
            VALUES (%s, %s, 'credential', %s, %s, %s)
            """,
            (uuid4(), str(user_id), user_id, now, now),
        )
        assert accounts.classify_email(conn, email) == "password"
        conn.execute(
            """
            INSERT INTO neon_auth.account
                (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
            VALUES (%s, %s, 'google', %s, %s, %s)
            """,
            (uuid4(), f"google-{user_id}", user_id, now, now),
        )
        assert accounts.classify_email(conn, email) == "both"
        assert accounts.refuse_linked_google(conn, user_id) is True
        assert accounts.classify_email(conn, email) == "password"
        users = conn.execute(
            'SELECT count(*) AS n FROM neon_auth."user" WHERE lower(email) = lower(%s)',
            (email,),
        ).fetchone()
        assert users is not None
        assert users["n"] == 1
        conn.rollback()
