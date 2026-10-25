"""Respondly API application."""

import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from respondly_api.core.env import load_env
from respondly_api.db.migrate import apply_migrations
from respondly_api.modules.identity.routes import router as identity_router


def create_app() -> FastAPI:
    load_env()
    app = FastAPI(title="Respondly", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(identity_router)
    if os.environ.get("DATABASE_URL_DIRECT") or os.environ.get("DATABASE_URL"):
        apply_migrations()
    return app


def _cors_origins() -> list[str]:
    raw = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = create_app()


def main() -> None:
    uvicorn.run(app, host="127.0.0.1", port=8000)
