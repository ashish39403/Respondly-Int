"""psycopg connections. Migrations use the direct URL."""

import os
from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from respondly_api.core.env import load_env


def database_url(*, direct: bool = False) -> str:
    load_env()
    if direct:
        url = os.environ.get("DATABASE_URL_DIRECT", "").strip() or os.environ.get(
            "DATABASE_URL", ""
        ).strip()
        key = "DATABASE_URL_DIRECT"
    else:
        url = os.environ.get("DATABASE_URL", "").strip()
        key = "DATABASE_URL"
    if not url:
        raise RuntimeError(f"{key} is not set")
    return url


@contextmanager
def connection(*, direct: bool = False) -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url(direct=direct), row_factory=dict_row) as conn:
        yield conn
