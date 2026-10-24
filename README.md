# Respondly

Multi-tenant AI-first customer support workspace. Visitors get answers from a business’s own documents, and a person takes over when the answer is uncertain or needs authority.

Start with [AGENTS.md](AGENTS.md). Product decisions are in [docs/respondly-v1-prd.md](docs/respondly-v1-prd.md). The build sequence is in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). The stack is in [docs/TECH_STACK.md](docs/TECH_STACK.md). Implementation happens in this workspace. Codex reviews the code. It does not own the frontend.

## Layout

| Path | Role |
|---|---|
| `apps/api` | One FastAPI application. Identity, workspaces, documents, widget, conversations, and answers are internal modules. |
| `apps/worker` | Separate Python process for document ingestion. Jobs are stored in PostgreSQL. |
| `apps/web` | Owner and agent UI. Next.js, TypeScript, Tailwind, and shadcn/ui. |
| `apps/widget` | Visitor widget, installed by snippet. Reserved and not scaffolded yet. |
| `docs` | Product requirements. |
| `eval/questions` | Fixed question set used to judge grounded answers. |

Python packages are one uv workspace on Python 3.12. The web app and widget stay outside that workspace.

## Setup

```bash
uv sync
uv run respondly-api
uv run respondly-worker
```

`uv sync` installs both Python apps into one environment because the workspace root depends on them.

`respondly-api` serves `GET /health`. `respondly-worker` starts and exits until ingestion jobs are added.
