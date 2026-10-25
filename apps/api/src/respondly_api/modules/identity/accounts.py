"""Account rows and the one-email provider check.

The worker must not import this module. neon_auth is read here only to see
whether an email already has a password, Google, or both. Password hashes and
OAuth tokens are never selected.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from psycopg import Connection


def classify_email(conn: Connection, email: str) -> str:
    rows = conn.execute(
        """
        SELECT a."providerId" AS provider_id
        FROM neon_auth."user" AS u
        JOIN neon_auth.account AS a ON a."userId" = u.id
        WHERE lower(u.email) = lower(%s)
        """,
        (email,),
    ).fetchall()
    providers = {str(row["provider_id"]) for row in rows}
    has_password = "credential" in providers
    has_google = "google" in providers
    if has_password and has_google:
        return "both"
    if has_password:
        return "password"
    if has_google:
        return "google"
    return "unknown"


def upsert_account(
    conn: Connection,
    account_id: UUID,
    name: str,
    email: str,
    verified_at: datetime,
) -> dict[str, Any]:
    row = conn.execute(
        """
        INSERT INTO app.accounts (id, name, email, verified_at)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email
        RETURNING id, name, email, verified_at
        """,
        (account_id, name, email, verified_at),
    ).fetchone()
    if row is None:
        raise RuntimeError("account upsert returned no row")
    return row


def refuse_linked_google(conn: Connection, account_id: UUID) -> bool:
    """Drop a Google link when this account already has a password.

    Neon cannot store two users for one email. If Google attaches to the
    password account, this removes that second sign-in method.
    """

    cursor = conn.execute(
        """
        DELETE FROM neon_auth.account AS google_account
        WHERE google_account."userId" = %s
          AND google_account."providerId" = 'google'
          AND EXISTS (
            SELECT 1
            FROM neon_auth.account AS password_account
            WHERE password_account."userId" = google_account."userId"
              AND password_account."providerId" = 'credential'
          )
        """,
        (account_id,),
    )
    return cursor.rowcount > 0
