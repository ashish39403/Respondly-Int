# Respondly V1 — Implementation plan

**Status:** Build plan for the locked V1 architecture.  
**Date:** 24 October 2026  
**Who builds:** the coding agent in this Cursor workspace, across the API, worker, owner UI, and widget.  
**Who reviews:** Codex. It reads the diff against the PRD and this plan. It does not implement the frontend or the API.  
**Read first:** this file, then [respondly-v1-prd.md](respondly-v1-prd.md), [TECH_STACK.md](TECH_STACK.md), [../GLOSSARY.md](../GLOSSARY.md), and the ADRs in `docs/adr/`.

Product behavior lives in the PRD. If this plan and the PRD disagree about a user-visible rule, the PRD wins. If they disagree about library choice or endpoint shape, this plan wins until the PRD is explicitly updated.

Do not add Redis, PartyKit, a second database, a separate vector store, microservices, or a second invitation system. A milestone that seems to need one of those is a signal to cut scope.

## 1. Current repository

Python is already a uv workspace on Python 3.12. `apps/api` exposes `GET /health`. `apps/worker` starts and exits. `apps/web` and `apps/widget` are reserved directories, not applications yet.

| Path | What it is | Now |
|---|---|---|
| `apps/api` | FastAPI modules: `identity`, `workspaces`, `documents`, `widget`, `conversations`, `answers`, plus `core` | Health route only |
| `apps/worker` | Ingestion process. Jobs live in Postgres | Starts and exits |
| `apps/web` | Next.js owner and agent UI | Not scaffolded |
| `apps/widget` | Vite snippet | Not scaffolded |
| `eval/questions` | Section 8 question set | Empty until milestone 4 |

## 2. Locked behavior the implementation must not redesign

- One Neon user id, one workspace, one role: Owner or Agent. No workspace switcher.
- Password signup cannot sign in until email verification. Verification uses codes, expires in 15 minutes, and can be resent. Google is the only social login. GitHub and Vercel stay off.
- One verified email is one Neon user. If the other sign-in method would create a second user, refuse that sign-in.
- The workspace is a Neon organization. Role records live there, not in a second membership table. Owner is Neon `owner`. Agent is Neon `member`. Do not use Neon `admin`.
- FastAPI validates the Neon JWT, then loads that organization membership and enforces the PRD permission matrix. Hiding a button is not authorization.
- Visitors are not Neon users. A visitor session owns the conversations it started and has at most one that is not Resolved. A resume link opens exactly one conversation.
- Automatic assistant replies stop at Pending Human and stay off through Assigned and Resolved. They return only on a new AI Active conversation.
- Email delivery does not resolve a conversation. Resolve is explicit and only from Assigned.
- The widget shows the current conversation only. Older conversations are not listed. A resume link is how a visitor reads one older conversation.
- Messages are stored before they are broadcast. One visitor send action stores one message.
- Ready documents from that workspace are the only retrieval corpus. No text extracted means Failed and absent from retrieval.

Terms in [GLOSSARY.md](../GLOSSARY.md) are the words to use in code, UI copy, and API names. Do not introduce ticket, chat thread, admin, or visitor token as synonyms.

## 3. Build defaults

These were chosen so implementation can start. Items marked tunable can change without a new service. Do not reopen them in a milestone unless a PRD acceptance check fails.

| Choice | Default | When it can change |
|---|---|---|
| Role store | Neon organization membership only | Not tunable. A second role table drifts |
| Database access | `psycopg` and checked-in SQL files in `apps/api/db/migrations` | Driver can change only if both API and worker move together |
| App connections | Neon pooled `DATABASE_URL` | Migrations use a direct URL |
| Embeddings | OpenAI `text-embedding-3-small`, 1536 dimensions, HNSW | Tunable only by re-embedding every Ready chunk |
| Chat model | Smallest plain-text model the AI Credits endpoint accepts | Tunable. Section 8 is the test, not a similarity cutoff |
| Retrieval cutoff | None at first | Tune only after the question set exists |
| Chunks | About 1,000 characters, 200 overlap | Tunable if the question set fails |
| PDF text | Local extractor in the worker. No text means Failed | Do not add a parsing service |
| Resume link | 14 days, revoked when a new link is issued | Tunable |
| Invites | Valid until accepted or cancelled | Neon publishes no lifetime |
| Rate limits | Postgres counters: 20 visitor messages per minute per session, 10 uploads per hour per workspace, 10 sign-in attempts per 15 minutes per address | Tunable numbers. Storage stays Postgres |
| Logo | Short-lived presigned read URL from the private bucket | Do not make the object public |
| Widget build | Vite library build, one script | Do not use Next.js or shadcn in the snippet |
| Logs | stdout | Do not add an error-tracking service in V1 |
| Neon compute | Scale-to-zero off on the branch that runs the worker | Required for ingestion and sockets |
| Row-level security | Off | FastAPI checks are the control |
| Resume email | Resend, behind one send function in the API | Swap the provider only behind that function |

## 4. How the work is split

Implementation of the API, worker, Next.js app, and widget happens in this workspace, in milestone order. Codex is the reviewer. After a milestone’s checks pass, Codex reviews that diff for PRD mismatches, auth gaps, and tenant leaks. Codex does not scaffold `apps/web` or choose a different stack.

`apps/web` is Next.js, React, TypeScript, Tailwind, and shadcn/ui, with `@neondatabase/auth`. Check the installed package before choosing `middleware.ts` or `proxy.ts`. Current Neon guidance expects Next.js 16 or newer for the Next server helper.

`apps/widget` is a separate Vite package. Public brand fields only. No shadcn, no Neon Auth, and no owner token.

The browser talks to Neon for sign-up, verification, Google, password reset, sign-out, and invitation accept. It talks to FastAPI with `Authorization: Bearer` for every business action. The Neon session cookie is not sent to FastAPI as the credential.

Never show a success state the API did not confirm. A refused claim, a refused owner action, a failed upload, and a failed resume email stay visible.

`apps/api`, `apps/worker`, SQL migrations, and `eval/questions` follow the same milestones. Verify JWTs with `NEON_AUTH_JWKS_URL` and the issuer from `NEON_AUTH_BASE_URL`. Tokens are EdDSA and expire in 15 minutes. Load the Neon organization membership for that user id on each protected request. If a token claim disagrees with that membership, refuse the request.

Do not query `neon_auth` from the worker or from retrieval. The identity module may read organization membership. Product rows live in the application schema, keyed by the Neon organization id. That id is the workspace id.

Close or reject a WebSocket when its token expires. Sign-out in the UI must close the socket. A copied token can still work until expiry. Do not pretend sign-out revokes it sooner.

### What Codex reviews

Review against the PRD checks for the milestone, not against a new design. Look for a second membership table, a Neon anonymous token used as a visitor session, an assistant reply after Pending Human, a resolve triggered by email, a widget that contains an owner credential, and a query that is not scoped by workspace id. Do not rewrite the feature in the review.

## 5. Shared API contract

FastAPI publishes its OpenAPI schema. The UI uses that schema once a route exists. Until then, implement the shapes below. JSON uses snake_case. Errors use a stable body:

```json
{ "error": "already_assigned", "message": "This conversation is already assigned." }
```

Status codes: 401 missing or invalid credential, 403 role or workspace refusal, 409 conflict such as a lost claim or a second workspace, 422 validation, 429 rate limit with a retry hint.

`GET /me` after a valid owner or agent token returns:

```json
{ "account_id": "neon-user-id", "workspace_id": "neon-org-id", "role": "owner" }
```

`role` is `owner` or `agent` in the API even though Neon stores `owner` or `member`. The UI never branches on the Neon word `member`.

No workspace yet returns 404 from `GET /me` with `error: "no_workspace"`. The UI then offers create-workspace to a verified account, or the invite accept screen.

### Identity and workspace

| Method | Path | Who | Result |
|---|---|---|---|
| GET | `/me` | Owner or agent JWT | Account, workspace, API role |
| POST | `/workspaces` | Verified JWT with no workspace | Creates the Neon organization and returns `/me` |
| GET | `/workspaces/invitations` | Owner | Pending invites |
| POST | `/workspaces/invitations` | Owner | Body `{ "email", "role" }` where `role` is `owner` or `agent`. Sends the Neon invite |
| POST | `/workspaces/invitations/{id}/cancel` | Owner | Cancels a pending invite |
| POST | `/workspaces/members/{id}/role` | Owner | Changes role inside this workspace. Refuses removal of the last owner |
| DELETE | `/workspaces/members/{id}` | Owner | Removes a member. Refuses the last owner |

Invitation accept stays a Neon client call, `organization.acceptInvitation`, on the route `/auth/accept-invitation?invitationId=`. The Next.js page must check `GET /me` first. If the account already has a workspace, it must not call accept. FastAPI also refuses any later request that would use a second workspace.

Unverified password users never reach `POST /workspaces`. Google users may, because Google has already verified the email.

### Documents and widget settings

| Method | Path | Who | Result |
|---|---|---|---|
| POST | `/documents/uploads` | Owner | Body is file name, type, and size. Returns a presigned PUT and a document id. Refuses a bad type or a file over 10 MB, and the 51st document |
| POST | `/documents/{id}/complete` | Owner | Records the object and enqueues one job |
| GET | `/documents` | Owner | Status Processing, Ready, or Failed, plus a readable failure reason |
| POST | `/documents/{id}/retry` | Owner | One new job. Does not create a second searchable copy |
| POST | `/documents/{id}/replace` | Owner | Old Ready version stays searchable until the new one is Ready |
| DELETE | `/documents/{id}` | Owner | Gone from retrieval immediately, including partial chunks |
| GET | `/widget-settings` | Owner, and a public snippet read of brand fields only | Settings |
| PUT | `/widget-settings` | Owner | Brand color, assistant name, welcome message, placement |
| POST | `/widget-settings/logo` | Owner | Presigned logo upload. The public settings payload contains a short-lived read URL and no owner credential |

Placement is `bottom_right` or `bottom_left`. Widget settings may be saved before any document is Ready.

### Visitor session and messages

| Method | Path | Who | Result |
|---|---|---|---|
| POST | `/public/sessions` | Snippet, workspace public id | Creates or resumes the browser’s visitor session. Returns a visitor credential |
| GET | `/public/conversations/current` | Visitor session | The current conversation, or none |
| POST | `/public/messages` | Visitor session or resume link | Stores one message. Header `Idempotency-Key` is a UUID. Retries return the same message |
| GET | `/public/messages?after=` | Visitor session or resume link | Missed messages in stored order |
| POST | `/public/resume/{token}` | Anyone with the link | Exchanges the raw link secret for a one-conversation credential |

A message on a Resolved conversation creates a new AI Active conversation only when that session has no current conversation. Otherwise the API returns 409 `current_conversation_exists` and stores nothing.

The resume credential cannot read any other conversation. A visitor credential cannot read a conversation that session did not start.

### Inbox

| Method | Path | Who | Result |
|---|---|---|---|
| GET | `/conversations?view=pending` | Owner or agent | Oldest escalation first |
| GET | `/conversations?view=mine` | Owner or agent | Assigned to that account |
| GET | `/conversations?view=all` | Owner | Every conversation, including AI Active |
| POST | `/conversations/{id}/claim` | Owner or agent | One winner. The loser gets 409 `already_assigned` and the winner’s display name |
| POST | `/conversations/{id}/messages` | The assignee, or an owner | Stores the reply. Status does not change |
| POST | `/conversations/{id}/unassign` | Assignee, or any owner | Returns to Pending Human. Assistant stays off |
| POST | `/conversations/{id}/resolve` | Assignee, or an owner | Only from Assigned |

Agents do not receive another agent’s assigned transcript. Owners do.

### Live socket

`GET /ws` on the API. The first client message is `{ "type": "auth", "token": "<bearer>" }`. The server sends nothing else until auth succeeds. Then the client sends `{ "type": "resume", "after": "<message-id>" }` and receives missed messages, then live messages for conversations that credential may see.

One API process only. Do not add a second replica to make sockets reliable. Reconnect plus `after` is the recovery path.

### Answer side effects

The visitor message route, when the conversation is AI Active, stores the visitor message, then runs retrieval and generation, then stores the assistant message or the escalation. Pending Human, Assigned, and Resolved store the visitor message and do not call the model.

Escalation reasons stored for agents: `visitor_requested_person`, `weak_evidence`, `conflicting_documents`, `needs_decision`, `provider_failure`. Visitors see a short status, not the reason code.

Assistant answers do not include raw chunks. Agents can see the document names used.

## 6. Milestones

A milestone is done when its checks pass, not when the files exist. Do not start the next milestone’s behavior until the current checks pass. Scaffolding the Next.js shell during milestone 1 is fine. Do not build the inbox UI before the conversation API exists.

### Milestone 1 — Identity and workspace

**Backend.** JWT verification. `GET /me` and `POST /workspaces`. Invite, cancel, role change, and remove, with last-owner protection. Map Neon `member` to API `agent`. Refuse a second workspace on create and on any request after a bad accept.

**Frontend.** Screens, in order: sign up, enter verification code, resend code, sign in, Google sign in, forgot password, reset password, sign out, create workspace, invite agent, accept invitation, member list. After sign-out, drop the bearer token and do not call FastAPI again until the next sign-in.

**Checks from the PRD.** Owner signs up, verifies email, creates one workspace, invites an agent. The agent is refused an upload, widget change, and invite. A second workspace create or a second accept is refused. An unverified password account cannot sign in or call `/workspaces`. Password reset replaces the old password. Google returns to a trusted URL. The same email cannot create two Neon users. Sign-out blocks the next protected call. A visitor credential is not required yet, and Neon anonymous tokens must not be used as a stand-in.

**Neon settings before this milestone.** Managed Auth on. Email and password with required verification. Verification codes. Google shared credentials for development only. Organizations on, organization limit 1, creator role owner, invitation emails on. Trusted domain includes the Next.js origin. Scale-to-zero off.

### Milestone 2 — Documents

**Backend.** Presigned upload, complete, list, retry, replace, delete. Worker claims a Postgres job, reads S3, extracts text, chunks, embeds, writes chunks, marks Ready or Failed. Delete cancels the job and hides chunks already written. Replace keeps the old Ready version until the new one is Ready.

**Frontend.** Document list with Processing, Ready, and Failed. Retry, replace, delete. The failure reason is visible. Rejected uploads name the limit. No manual database step.

**Checks.** A TXT or Markdown file becomes Ready. A failed job can be retried into one searchable version. A deleted Ready document is absent later. A disallowed type never becomes Ready. An image-only or empty file becomes Failed.

### Milestone 3 — Widget transcript

**Backend.** Public session, current conversation, idempotent messages, history after an id, WebSocket auth and resume. No model call yet. Store the message and echo it live.

**Frontend.** Vite snippet with brand color, logo, assistant name, welcome message, and placement. One current conversation. Pending state until the store succeeds, and a retry that reuses the same idempotency key. Reconnect shows missed messages in order. Owner screen to edit widget settings and copy the snippet.

**Checks.** A stored message survives refresh. A disconnected widget sees the missed message in order. The snippet contains no owner credential and no Neon key.

### Milestone 4 — Grounded answers

**Backend.** Answers module. Retrieve Ready chunks for that workspace only. LangChain calls OpenAI embeddings for the query and the AI Credits chat endpoint for the reply. On provider failure, store no fabricated answer, escalate with `provider_failure`. Clarification limit is two turns, then offer a person. Conflicting Ready documents escalate instead of choosing silently. Action requests describe only the published policy, then escalate.

**Frontend.** Show the assistant message and the assistant name. Do not show chunks. Agents later see document names. That agent view can wait for milestone 5 if the API already returns the names on the message.

**Data.** Write `eval/questions` before calling this milestone done. Cover in-policy, ambiguous, unsupported, conflicting documents, action request, and hostile instructions inside a document.

**Checks.** The section 8 trust rows. No Ready documents produces an offer of a person, not an invented policy.

### Milestone 5 — Handoff

**Backend.** Pending queue, claim transaction, reply, unassign, resolve. Offline reply sends Resend with a 14-day one-conversation link. Email failure is stored and returned to the agent. Status stays Assigned. Visitor messages while Pending Human or Assigned are stored with no assistant reply. A message after Resolved opens a new AI Active conversation on the same session only when no current conversation exists.

**Frontend.** Agent inbox: pending, mine. Owner inbox: all, including AI Active. Claim errors show who won. Resolve is a separate control from send. If email failed, the agent sees that. The widget shows waiting and resolved in short status text, not internal reason codes. Resume-link page shows that one conversation and no history list.

**Checks.** PRD handoff checks 7 through 10, plus check 20. Two agents cannot both win a claim. Resolve from AI Active or Pending Human is refused.

### Milestone 6 — Isolation and hardening

**Backend.** Rate-limit counters in Postgres. Upload type and size checks, if any were only partial. Prompt assembly treats document text as evidence, not instructions. Every query is scoped by workspace id.

**Frontend.** No new product surface. Exercise the two-workspace demo with two accounts.

**Checks.** PRD golden-path check 6 and access checks 14 through 18. A token, id, or link from workspace A does not return workspace B. An injection document does not approve a refund or reveal the other tenant.

## 7. Frontend screen map

Build these in `apps/web`, and only these visitor surfaces in `apps/widget`.

| Screen | App | Milestone |
|---|---|---|
| Sign up, verify code, resend | web | 1 |
| Sign in, Google | web | 1 |
| Forgot and reset password | web | 1 |
| Create workspace | web | 1 |
| Invite, member list, accept invite | web | 1 |
| Documents | web | 2 |
| Widget settings and snippet | web | 3 |
| Inbox and conversation | web | 5 |
| Snippet conversation | widget | 3, answers in 4, handoff states in 5 |
| Resume-link conversation | widget | 5 |

Desktop layout for the owner and agent UI. English copy. The visitor widget must work on the customer site, so its API calls are cross-origin and use the visitor credential, never a cookie from the dashboard.

## 8. Data the backend owns

Application tables, all carrying `workspace_id` equal to the Neon organization id:

- `documents` and `document_versions` with status and failure reason
- `ingestion_jobs` claimed atomically by the worker
- `chunks` with the 1536-dimension vector, excluded as soon as the version is not Ready
- `visitor_sessions`
- `conversations` with state, escalation reason, assignee account id, and a single current-conversation rule per session
- `messages` with idempotency key, author (`visitor`, `assistant`, `agent`, `owner`), and optional source document names
- `resume_links` storing a hash of the secret, expiry, and revoked time
- `rate_limit_buckets`

Do not store original files in Postgres. Store the S3 key. Do not store raw resume secrets or Neon access tokens.

## 9. Environment

Secrets stay in `.env`, which is gitignored. Do not put them in the snippet or in git.

| Name | Used by |
|---|---|
| `NEON_AUTH_BASE_URL` | Next.js |
| `NEON_AUTH_JWKS_URL` | FastAPI |
| `NEON_AUTH_COOKIE_SECRET` | Next.js, 32 or more characters |
| `DATABASE_URL` | API and worker, pooled |
| `DATABASE_URL_DIRECT` | Migrations |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | API and worker, from milestone 2 |
| `OPENAI_API_KEY` | Worker and answers, embeddings only |
| `AI_CREDITS_BASE_URL`, `AI_CREDITS_API_KEY`, `AI_CREDITS_MODEL` | Answers module only |
| `RESEND_API_KEY`, `RESEND_FROM` | API, milestone 5 |
| `CORS_ORIGINS` | API. Dashboard origin plus the widget script’s needs. Visitor calls are authorized by their own credential |

The embeddings client and the chat client must be separate objects. Do not point the embeddings key at the AI Credits host.

## 10. Local run

From the repo root, after milestone 1’s dependencies exist:

```bash
uv sync
uv run respondly-api
uv run respondly-worker
```

The Next.js app and the widget dev server run from their own directories. The API remains the process on port 8000 that already serves `GET /health`.

## 11. Do not “fix” these on purpose

- Do not add Redis so a second API instance can share sockets.
- Do not use `getAnonymousToken()` as the visitor session.
- Do not give Agents the Neon `admin` role so they can manage members.
- Do not keep a parallel membership table that can disagree with Neon.
- Do not call the chat model while a conversation is Pending Human, Assigned, or Resolved.
- Do not mark a conversation Resolved because an email was sent.
- Do not import shadcn or Neon Auth into the widget.
- Do not enable GitHub or Vercel login, MFA, or passkeys. Managed Auth does not offer MFA or passkeys.
- Do not change a user’s email through `updateUser()`. Managed Auth cannot do that.

## 12. Known limits the code must respect

The organization plugin is beta. Milestone 1’s checks are the proof that invites work on this Neon branch.

A JWT can outlive sign-out for up to 15 minutes. The UI drops its copy and closes the socket. The API still rejects only expired or invalid tokens.

Google and password for the same email must be tested in both orders before milestone 1 is accepted.

Neon mail and Resend fail separately. The inbox shows a failed resume email and does not change status.

Live delivery assumes one API process. Reconnect reads missed messages from Postgres.
