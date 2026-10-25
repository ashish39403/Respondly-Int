"""Apply checked-in SQL migrations in filename order."""

from pathlib import Path

from respondly_api.db.connection import connection

_MIGRATIONS = Path(__file__).resolve().parents[3] / "db" / "migrations"


def apply_migrations() -> None:
    files = sorted(_MIGRATIONS.glob("*.sql"))
    with connection(direct=True) as conn:
        conn.execute(
            """
            CREATE SCHEMA IF NOT EXISTS app;
            CREATE TABLE IF NOT EXISTS app.schema_migrations (
                filename text PRIMARY KEY,
                applied_at timestamptz NOT NULL DEFAULT now()
            )
            """
        )
        applied = {
            row["filename"]
            for row in conn.execute("SELECT filename FROM app.schema_migrations").fetchall()
        }
        for path in files:
            if path.name in applied:
                continue
            script = path.read_text(encoding="utf-8")
            for statement in _statements(script):
                conn.execute(statement)
            conn.execute(
                "INSERT INTO app.schema_migrations (filename) VALUES (%s)",
                (path.name,),
            )


def _statements(script: str) -> list[str]:
    return [part.strip() for part in script.split(";") if part.strip()]
