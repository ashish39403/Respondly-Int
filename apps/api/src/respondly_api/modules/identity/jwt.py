"""Verify a Neon Auth JWT. A valid token is not a workspace role."""

import os
from urllib.parse import urlparse
from uuid import UUID

import jwt
from jwt import PyJWKClient, PyJWKClientError

from respondly_api.core.env import load_env

_jwks: PyJWKClient | None = None


class TokenError(Exception):
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


def verify_token(token: str) -> dict:
    load_env()
    issuer = _issuer()
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            issuer=issuer,
            audience=issuer,
            options={"require": ["exp", "iss", "sub"]},
        )
    except PyJWKClientError as exc:
        raise TokenError("jwks") from exc
    except jwt.PyJWTError as exc:
        raise TokenError("invalid") from exc
    if not isinstance(claims, dict):
        raise TokenError("invalid")
    subject = claims.get("sub")
    claim_id = claims.get("id")
    try:
        UUID(str(subject))
    except (TypeError, ValueError) as exc:
        raise TokenError("invalid") from exc
    if claim_id is not None and str(claim_id) != str(subject):
        raise TokenError("invalid")
    return claims


def email_is_verified(claims: dict) -> bool:
    value = claims.get("emailVerified", claims.get("email_verified"))
    return value is True


def account_name(claims: dict) -> str:
    name = claims.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return ""


def account_email(claims: dict) -> str:
    email = claims.get("email")
    if isinstance(email, str) and email.strip():
        return email.strip().lower()
    return ""


def _issuer() -> str:
    base_url = os.environ.get("NEON_AUTH_BASE_URL", "").strip()
    if not base_url:
        raise TokenError("jwks")
    parsed = urlparse(base_url)
    if not parsed.scheme or not parsed.netloc:
        raise TokenError("jwks")
    return f"{parsed.scheme}://{parsed.netloc}"


def _jwks_client() -> PyJWKClient:
    global _jwks
    if _jwks is None:
        url = os.environ.get("NEON_AUTH_JWKS_URL", "").strip()
        if not url:
            raise TokenError("jwks")
        _jwks = PyJWKClient(url, cache_keys=True, lifespan=3600)
    return _jwks
