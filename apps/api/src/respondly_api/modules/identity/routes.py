"""Identity routes for this auth slice. No workspace is created here."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

from respondly_api.db.connection import connection
from respondly_api.modules.identity.accounts import (
    classify_email,
    refuse_linked_google,
    upsert_account,
)
from respondly_api.modules.identity.jwt import (
    TokenError,
    account_email,
    account_name,
    email_is_verified,
    verify_token,
)

router = APIRouter()


class EmailStatusBody(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or email.startswith("@") or len(email) > 254:
            raise ValueError("Enter a valid email address.")
        return email


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": code, "message": message})


def _bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


@router.post("/identity/email-status")
def email_status(body: EmailStatusBody) -> JSONResponse:
    try:
        with connection() as conn:
            kind = classify_email(conn, body.email)
    except Exception:
        return _error(503, "auth_unavailable", "We couldn't check that email. Try again.")
    return JSONResponse(status_code=200, content={"kind": kind})


@router.post("/accounts")
def create_account(authorization: str | None = Header(default=None)) -> JSONResponse:
    token = _bearer(authorization)
    if token is None:
        return _error(401, "invalid_token", "Sign in again.")
    try:
        claims = verify_token(token)
    except TokenError as exc:
        if exc.reason == "jwks":
            return _error(503, "auth_unavailable", "Sign-in couldn't be checked. Try again.")
        return _error(401, "invalid_token", "Sign in again.")
    if not email_is_verified(claims):
        return _error(403, "email_unverified", "Verify your email before continuing.")
    name = account_name(claims)
    email = account_email(claims)
    if not name or not email:
        return _error(
            422,
            "account_not_saved",
            "The account is signed in, and the next sign-in will try to save it.",
        )
    try:
        with connection() as conn:
            row = upsert_account(
                conn,
                UUID(str(claims["sub"])),
                name,
                email,
                datetime.now(UTC),
            )
    except Exception:
        return _error(
            500,
            "account_not_saved",
            "The account is signed in, and the next sign-in will try to save it.",
        )
    verified_at = row["verified_at"]
    return JSONResponse(
        status_code=200,
        content={
            "account_id": str(row["id"]),
            "name": row["name"],
            "email": row["email"],
            "verified_at": verified_at.isoformat(),
        },
    )


@router.post("/identity/second-method")
def second_method(authorization: str | None = Header(default=None)) -> JSONResponse:
    token = _bearer(authorization)
    if token is None:
        return _error(401, "invalid_token", "Sign in again.")
    try:
        claims = verify_token(token)
    except TokenError as exc:
        if exc.reason == "jwks":
            return _error(503, "auth_unavailable", "Sign-in couldn't be checked. Try again.")
        return _error(401, "invalid_token", "Sign in again.")
    try:
        with connection() as conn:
            refused = refuse_linked_google(conn, UUID(str(claims["sub"])))
    except Exception:
        return _error(503, "auth_unavailable", "Sign-in couldn't be checked. Try again.")
    return JSONResponse(status_code=200, content={"refused": refused})
