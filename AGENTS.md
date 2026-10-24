# Respondly

Multi-tenant support workspace. Visitors get answers from one business’s documents. A person takes over when the answer is uncertain or needs authority.

Implementation happens in this workspace. Codex reviews diffs. It does not choose the stack or own the frontend.

## Read first

1. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — build order, API shapes, defaults
2. [docs/respondly-v1-prd.md](docs/respondly-v1-prd.md) — product behavior and acceptance checks
3. [docs/TECH_STACK.md](docs/TECH_STACK.md) — why each dependency is here
4. [GLOSSARY.md](GLOSSARY.md) — words to use in code and UI

If the plan and the PRD disagree about what the user sees, the PRD wins. If they disagree about a library or an endpoint shape, the plan wins until the PRD is updated.

## Do not reopen

- One Neon user, one workspace, one role: Owner or Agent. No workspace switcher.
- Password signup cannot sign in until the email code is verified. Google is the only social login.
- One verified email is one Neon user. A second sign-in that would create another user is refused.
- The workspace is the Neon organization. Do not add a second membership table. API role `agent` is Neon role `member`. Never use Neon `admin`.
- FastAPI checks the Neon JWT, then loads that membership. A hidden button is not authorization.
- Visitors are not Neon users. Do not use `getAnonymousToken()` as a visitor session.
- A visitor session has at most one conversation that is not Resolved. The widget shows only that conversation. A resume link opens one conversation.
- Assistant replies stop at Pending Human and stay off through Assigned and Resolved.
- Sending email does not resolve a conversation.
- One API process. Do not add Redis, PartyKit, a second database, or a separate vector store.

## Where work goes

| Path | Write here |
|---|---|
| `apps/web` | Next.js owner and agent UI. See `apps/web/AGENTS.md`. |
| `apps/widget` | Vite snippet. No shadcn, no Neon Auth, no owner secret. |
| `apps/api` | FastAPI modules already named in `src/respondly_api/modules`. |
| `apps/worker` | Ingestion only. Jobs are rows in Postgres. |
| `eval/questions` | Section 8 question set, before grounded answers are called done. |

## Build order

Finish a milestone when its PRD checks pass, not when the files exist.

1. Identity and workspace
2. Documents through the worker
3. Widget transcript, live delivery, reconnect
4. Grounded answers
5. Claim, reply, resume email, explicit resolve
6. Two-workspace isolation and rate limits

## API boundary

The browser talks to Neon for sign-up, verification, Google, password reset, sign-out, and invite accept. Every business action goes to FastAPI with `Authorization: Bearer`. The Neon session cookie is not the API credential. JSON is snake_case. The UI role is `owner` or `agent`.

Store a message before broadcasting it. One visitor send, including retries with the same idempotency key, stores one message.

## Secrets

`.env` and key files stay untracked. Copy `apps/web/.env.example` to `.env.local` only when auth is wired. Do not put secrets in the widget snippet.
