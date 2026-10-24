# Respondly V1 — Technical stack

**Status:** Implementation guide for the settled stack. It does not choose the items the PRD still marks Open.  
**Date:** 24 October 2026  
**Product contract:** [respondly-v1-prd.md](respondly-v1-prd.md)  
**Diagrams:** the state machine, the three product flows, and the single-runtime architecture diagram.

This document says what each chosen technology is responsible for, why it is in V1, how it connects to the others, what must be configured, and what can go wrong. Schemas, routes, prompts, and chunk sizes are still technical design. Where this guide would have to invent one of those, the choice is listed as unresolved instead.

## 1. Shape

V1 is one modular FastAPI process, one Python ingestion worker, one Neon Postgres database, and private S3. The owner and agent UI is a Next.js app. The visitor widget is a separate snippet. Live delivery is a WebSocket on the API, after the message is stored. Nothing in the request path depends on Redis, PartyKit, a second database, or a separate vector store.

```text
Browser (Next.js)  --Neon Auth JWT-->  FastAPI modular monolith  --SQL + pgvector-->  Neon Postgres
Widget snippet     --visitor or resume credential-->  FastAPI  --WebSocket-->  widget and inbox
FastAPI            --presign-->  AWS S3
FastAPI            --enqueue job row-->  Neon Postgres  --claim-->  ingestion worker
Worker             --read object-->  S3
Worker             --embed-->  OpenAI embeddings
Worker             --write chunks-->  Postgres + pgvector
FastAPI            --retrieve-->  pgvector
FastAPI            --generate-->  AI Credits (OpenAI-compatible API) via LangChain
FastAPI            --resume email-->  transactional email provider (not chosen)
```

In-memory state is only a live socket. A restart may drop sockets. It must not drop messages, jobs, documents, or memberships.

The Python side already exists as one uv workspace on Python 3.12:

| Path | Runtime |
|---|---|
| `apps/api` | FastAPI modules: identity, workspaces, documents, widget, conversations, answers |
| `apps/worker` | Ingestion process. Jobs live in Postgres |
| `apps/web` | Next.js UI. Not scaffolded yet |
| `apps/widget` | Snippet. Not scaffolded yet |

## 2. Explicitly out of V1

| Technology | Why it stays out |
|---|---|
| Redis | Jobs, rate-limit coordination, and live fan-out stay in Postgres or in the one API process. A requirement that needs Redis is a signal to cut scope. |
| PartyKit or another realtime host | Live messages are FastAPI WebSockets. |
| A separate vector database | Vectors are pgvector columns in the same Neon database as the business rows. |
| Microservices | One API process with internal modules. The worker is a second process, not a second product boundary. |
| Neon Auth anonymous tokens as visitor identity | `getAnonymousToken()` is a Neon Data API token. It is not a Respondly visitor session. |
| Neon Auth organization role `admin` | It can manage members. V1 uses only `owner` and `member`. FastAPI still enforces Owner and Agent. |
| GitHub and Vercel sign-in | Google is the only social provider in V1. |

## 3. Next.js, React, and TypeScript

**Purpose.** The desktop UI for owners and agents: sign-up, workspace setup, documents, widget settings, team invites, and the inbox.

**Why.** The PRD fixes the owner and agent UI as Next.js, React, and TypeScript. One TypeScript app can hold both roles and hide owner actions in the interface. The server still enforces those actions.

**Integration.** The browser signs in with Neon Auth. Protected API calls send the Neon Auth JWT to FastAPI. The UI does not read Postgres, S3, or the model providers. After a disconnect, the inbox reloads missed messages from the API in stored order, then attaches its WebSocket.

**Dependencies and configuration.**

- Node is already available for the web app. The app itself is not scaffolded.
- The Neon Auth client is `@neondatabase/auth`. Do not swap in bare `better-auth/client` while Auth is managed.
- `NEON_AUTH_BASE_URL` and `NEON_AUTH_JWKS_URL` come from Neon when Auth is enabled.
- `NEON_AUTH_COOKIE_SECRET` is an app secret of at least 32 characters. Neon does not inject it.
- The app origin must be on the Neon Auth trusted-domain list. Localhost ports are allowed unless that default was turned off.
- Owner and agent screens are desktop browsers, English UI.

**Security and reliability.** A hidden button is not authorization. Every mutation goes to FastAPI. The UI treats a refused claim, a refused owner action, and a failed email as states the API returns. Session cookies for Neon Auth are for the Next.js host. They are not assumed to be visible to FastAPI on another host.

## 4. shadcn/ui

**Purpose.** The component set for the owner and agent UI: forms, tables, dialogs, and the inbox.

**Why.** The PRD names shadcn/ui for that UI. It is a source-level component set, so Respondly owns the code it copies in.

**Integration.** Used only inside `apps/web`. The widget does not import it. The snippet must stay small and must not ship the dashboard kit onto customer sites.

**Dependencies and configuration.** shadcn/ui styles with Tailwind CSS. Adding the kit means adding Tailwind to the Next.js app. No other styling system is selected. The visual preset is not selected.

**Security and reliability.** Components do not enforce roles. Destructive actions, including delete and resolve, still need the API result before the UI shows success.

## 5. Visitor widget

**Purpose.** The embeddable chat snippet: one anonymous session per browser per workspace, the current conversation, live messages, and the resume-link view of one conversation.

**Why.** The PRD requires a JavaScript snippet with no private API key and no owner or agent credential. The architecture diagram shows it as an embeddable script beside the React dashboard, not as a page of that dashboard.

**Integration.** The business site loads the script. The script talks only to FastAPI, using a visitor-session credential or a resume-link credential. It opens a WebSocket after the server has stored a message. On reconnect it requests the messages it missed. It shows the current conversation only. A resume link renders the one conversation named by that link, including a resolved one. It does not render a history list.

**Dependencies and configuration.** React is allowed. The bundler, package manager, and host for the script file are not chosen. The script origin and the API origin will differ from the customer site, so the API must allow that browser call explicitly.

**Security and reliability.** The snippet contains only public brand fields: color, logo address, assistant name, welcome message, and placement. The logo address must not carry an owner credential. The widget stores its visitor credential in the browser. That credential is not a Neon Auth session. A send retries with the same idempotency identity so one action becomes one stored message.

## 6. FastAPI modular monolith

**Purpose.** The only HTTP and WebSocket server. It authenticates callers, applies the permission matrix, stores messages before delivery, runs retrieval and generation for AI Active conversations, claims conversations, and records jobs.

**Why.** The PRD requires one Python FastAPI application. Modules keep identity, workspaces, documents, widget, conversations, and answers apart without a network hop between them.

**Integration.**

| Module | Responsibility |
|---|---|
| identity | Verify a Neon Auth JWT. Resolve the one membership. Refuse a second workspace. |
| workspaces | Workspace, settings, invites, and role changes inside that one membership. |
| documents | Upload validation, document rows, and job rows. Not parsing. |
| widget | Public brand config and visitor sessions. |
| conversations | States, messages, claim, unassign, resolve, resume links. |
| answers | Retrieval, the answer policy, and escalation. Runs only for AI Active. |

The worker imports nothing over HTTP. It shares the database. A message is inserted, then the API broadcasts it to sockets that are connected to that conversation. If the visitor socket is absent and an email is stored, the API asks the email provider to send a resume link. Provider failure is recorded. Status does not change.

**Dependencies and configuration.**

- Python 3.12, uv workspace, package `respondly-api`.
- FastAPI and Uvicorn are already the API dependencies.
- The process needs the database URL, the Neon Auth issuer and JWKS URL, S3 settings, the OpenAI embeddings credential, the AI Credits base URL and credential, and the email credential once a provider exists.
- One API instance is the V1 deployment assumption. A second instance is not part of the design.

**Security and reliability.**

- Protected owner and agent routes require a valid Neon Auth JWT. FastAPI checks the signature against `NEON_AUTH_JWKS_URL` and the issuer from `NEON_AUTH_BASE_URL`. Managed tokens are EdDSA (Ed25519) and expire in 15 minutes. Workspace id and role come from the membership row. A token claim is not enough, and a claim that disagrees with that row is refused.
- A valid JWT is not permission. The membership row must exist, must be the account’s only workspace, and must match the role the route requires.
- Signing out of Neon Auth ends the browser session. It does not instantly revoke a JWT that was already issued. Short expiry is the bound.
- Visitor and resume credentials are checked before any conversation body is read or written. A miss returns the same refusal for a foreign workspace, a foreign session, and a resume link used on the wrong conversation.
- Rate limits apply to visitor messages, uploads, and authentication attempts. They are configurable. One workspace’s traffic must not consume another workspace’s budget. Where those counters live is unresolved.
- Claim is one database transaction. Two claim requests leave exactly one winner.

## 7. Ingestion worker

**Purpose.** A separate Python process that parses, chunks, embeds, and marks a document Ready or Failed.

**Why.** Ingestion is slow and must survive an API restart. The PRD puts it in a second process with PostgreSQL-backed jobs, not a second queue product.

**Integration.** The API inserts a job row in the same transaction as the document change that needs work. The worker claims a job, reads the object from S3, and writes chunks back to Postgres. The API does not embed during the upload request.

Job rules that are already product requirements:

- A retry of the same version does not create a second searchable copy.
- While a replacement is Processing, the previous Ready version stays searchable. When the replacement is Ready, the previous version leaves retrieval. If the replacement fails, the previous Ready version stays.
- Delete removes the document from retrieval immediately, including chunks already written, and cancels the in-progress job.
- A file with no extractable text becomes Failed with a reason the owner can read, and it is never retrieved.
- PDF, TXT, and Markdown are the allowed types. The default limit is 10 MB and 50 documents per workspace.

**Dependencies and configuration.** Package `respondly-worker` in the same uv workspace and the same Python 3.12 environment. It needs the database URL, S3 read access, and the OpenAI embeddings credential. It does not need Neon Auth or the chat model.

**Security and reliability.** The worker uses its own credentials. It does not accept public HTTP traffic. A crash mid-job leaves the document Processing or Failed, never a partial Ready. The claim of a job must be atomic in Postgres so two worker processes cannot publish two copies of one version. The SQL pattern for that claim is an implementation detail of this requirement, not a reason to add a queue.

Parser libraries are not chosen. The outcome is chosen: image-only and empty files fail visibly.

## 8. Neon Auth

**Purpose.** Login, verification, password reset, sessions, and workspace invitations for owners and agents. Visitors stay on the separate anonymous session.

**Why.** The PRD requires Neon Managed Better Auth. The supported client is `@neondatabase/auth`. Bare `better-auth/client` is not a substitute while Auth is managed. Users and sessions live in the `neon_auth` schema.

**Integration.**

Next.js owns the browser session. `createNeonAuth` from `@neondatabase/auth/next/server` proxies Auth through `app/api/auth/[...path]`. The browser client is `createAuthClient()` from `@neondatabase/auth/next` and takes no arguments. Protected pages use the SDK middleware. Before a protected mutation, the server still checks the session. FastAPI does not read that cookie. The Next.js app calls `auth.token()` and sends `Authorization: Bearer` to FastAPI.

FastAPI validates the JWT with `NEON_AUTH_JWKS_URL` and the issuer from `NEON_AUTH_BASE_URL`. Managed tokens are EdDSA (Ed25519) and expire in 15 minutes. A valid token is not a role. FastAPI loads the single membership and applies section 2 of the PRD. Client checks such as `checkRolePermission` do not authorize a request.

Workspace membership uses the Organization plugin, which is beta. V1 configuration:

- Organizations enabled.
- `organization_limit` set to 1, so an account cannot create a second organization.
- `creator_role` set to `owner`.
- `send_invitation_email` set to true. This works only when verify-at-signup is enabled.
- Invites use `owner` for an additional Owner and `member` for an Agent. `admin` is not used.
- The accept route is `/auth/accept-invitation?invitationId=`. The signed-in, verified user accepts that one id. FastAPI still refuses the accept when the account already has a workspace. The documented organization limit blocks creating another organization. It is not, by itself, the accept check.

Product RBAC stays in FastAPI. Neon’s `member` role cannot manage the organization, which matches an Agent who must not invite or change settings. Claim, reply, and resolve are FastAPI permissions for both Owner and Agent.

**Email and password.** Enabled with `require_email_verification`. Unverified password users cannot sign in. V1 uses verification codes, because codes work on the shared SMTP sender and verification links require custom SMTP. Codes and links both expire after 15 minutes. Resend uses `sendVerificationEmail`. Password reset uses `requestPasswordReset` and `resetPassword`. A signed-in user changes a password with `changePassword` and may set `revokeOtherSessions`. `updateUser()` can change the display name. It cannot change the email or the password.

**Google.** `signIn.social({ provider: "google", callbackURL })`. Google redirects to `{NEON_AUTH_BASE_URL}/callback/google`. Neon then redirects to `callbackURL`, which must be a trusted origin. `newUserCallbackURL` and `errorCallbackURL` follow the same rule. Development may use Neon’s shared Google credentials. Production uses a Google OAuth client owned by the project. Each Neon branch has its own Auth base URL, so each branch needs its own redirect URI. The consent screen shows the Neon auth host unless Google branding is completed. Apps left in Google’s testing mode only allow listed test users.

**Account linking.** One verified email is one Neon user and one workspace. Managed Auth does not document automatic linking, and email changes are unsupported. If password signup and Google sign-in would create two users for the same email, the second sign-in is refused. That behavior has to be proven before milestone 1 is accepted.

**Email delivery.** Verification, resend, password reset, and organization invitations are Neon Auth mail. Getting started can use the shared sender `auth@mail.myneon.app`. Production needs custom SMTP. The visitor resume email is not this mail path and still has no provider.

**Sign-out.** `signOut()` ends the browser session. FastAPI does not treat that as instant revocation of a JWT already issued. The token remains usable until it expires, which is at most 15 minutes. Protected routes after sign-out must obtain a new token and fail when they cannot.

**Dependencies and configuration.**

- `@neondatabase/auth` for the Next.js app. Optional UI is `@neondatabase/auth-ui`. The widget does not import either package.
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` from the branch. `NEON_AUTH_COOKIE_SECRET` is generated for the Next.js app and is at least 32 characters.
- Trusted domains include every `callbackURL` origin. Localhost is allowed unless that default was turned off.
- Managed Auth is AWS-region only and cannot be enabled with IP Allow or Private Networking.
- MFA and passkeys are not available on Managed Auth.

**Security and reliability.** Do not query `neon_auth` from the worker or from retrieval. Store the Neon user id as the account id. Do not log invitation ids or reset tokens. The widget never receives a Neon session. `getAnonymousToken()` is not the visitor session.

## 9. Neon PostgreSQL

**Purpose.** The system of record for memberships, workspaces, widget settings, documents, jobs, chunks, visitor sessions, conversations, messages, claims, and resume links.

**Why.** The PRD requires one Neon Postgres database. Branching and the Auth schema come with that database. A second database is out of scope.

**Integration.** FastAPI handles short transactions: store message, claim, resolve, enqueue job. The worker handles longer ingestion transactions. Both use the same schema and the same document-status rules. Migrations use a direct connection. Application traffic uses Neon’s pooled connection.

**Dependencies and configuration.**

- `DATABASE_URL` for pooled application traffic.
- A direct, non-pooled URL for migrations and any session-level operation.
- The application schema is separate from `neon_auth`.
- The migration tool is not chosen. There is one migration stream for the repo, applied before either process relies on a new table.

**Security and reliability.** Every business query is scoped by the workspace id resolved from the caller. Server-side checks are required. Postgres row-level security is compatible with Neon and is not selected. Connection failures surface as failed requests or failed jobs, not as invented answers. Neon can scale compute to zero. A worker that polls for jobs, and an API that holds WebSockets, both need the compute to be awake. How that suspend behavior is set for V1 is unresolved.

## 10. pgvector

**Purpose.** Store embeddings beside the chunk text and retrieve Ready chunks for one workspace.

**Why.** The PRD requires vectors in the same database. A query can filter by workspace and Ready status and then order by distance, without a second store to keep consistent.

**Integration.** The worker writes embeddings after a successful parse. The answers module reads them only for Ready documents in the caller’s workspace. LangChain orchestrates the call. It does not own a vector database connection. Deleted and Failed documents are absent, including chunks written before a delete.

**Dependencies and configuration.** The `vector` extension is enabled on the Neon database. The column dimension must match the embedding model. That model is not chosen, so the dimension is not chosen. The index type is not chosen. Changing the embedding model later means re-embedding every Ready chunk. Until the model is fixed, do not create the production index.

**Security and reliability.** A similarity score does not widen what the assistant may say. The product test is the question set in section 8 of the PRD, not a cutoff number. The cutoff itself is unresolved. Retrieval that returns no usable evidence escalates. It does not call the chat model to fill the gap with general knowledge.

## 11. AWS S3

**Purpose.** Private storage for original uploads and the widget logo file.

**Why.** The PRD requires private S3 and short-lived presigned access. Postgres stores the object key and the document status, not the file bytes.

**Integration.** The owner UI asks FastAPI for a presigned upload. FastAPI validates type and size before it signs. The browser uploads to S3. FastAPI then records the object and the job. The worker reads the object with server credentials. Downloads of originals, when the product needs them, are also presigned and short-lived.

**Dependencies and configuration.** Bucket name, region, and credentials that can sign uploads and let the worker read objects. The bucket blocks public access. Object keys include the workspace id so a key from another workspace is obvious in review. Lifecycle rules and the exact presign TTL are not chosen.

**Security and reliability.** A presigned URL is not an admin session. It expires, and it is scoped to one object. The widget logo still has to render without an owner credential. A public object, a public prefix, or a repeatedly refreshed read URL are all possible, and none is chosen. That gap is listed below. Failed uploads leave no Ready document.

## 12. LangChain

**Purpose.** Orchestrate retrieval and generation inside the answers module: load the workspace’s Ready context, apply the answer policy, and call the chat model.

**Why.** The PRD names LangChain as the orchestration layer. It is not a hosting platform and not a vector database.

**Integration.** Called only when the conversation is AI Active and the visitor message is already stored. Pending Human, Assigned, and Resolved do not call it. The path is: validate credential, store message, retrieve, judge evidence, generate or clarify or escalate, store the outcome, then deliver. On provider failure, store no fabricated answer. Offer a person and record provider failure.

**Dependencies and configuration.** The Python LangChain packages and the pinned versions are not installed yet. Use the OpenAI embeddings integration against OpenAI, and the OpenAI-compatible chat integration against the AI Credits base URL. Do not add a LangChain vector-store backend.

**Security and reliability.** Retrieved text is evidence. It is not instructions. A document that says to ignore the rules or approve a refund does not change the policy. The prompt template and the clarification limit of two turns are product rules. The literal prompt text is still technical design.

## 13. OpenAI embeddings

**Purpose.** Turn chunk text into vectors for pgvector.

**Why.** The PRD names OpenAI for embeddings, separate from the chat provider.

**Integration.** Only the worker calls the embeddings API, during ingestion. Retrieval compares a query embedding, produced by the API at answer time, with stored chunk embeddings from the same model. Both calls must use the same model and dimension.

**Dependencies and configuration.** An OpenAI API key and the model name. The model name is an Open item in the PRD. No embedding call is made from the browser.

**Security and reliability.** Chunk text leaves the network boundary to OpenAI. That is required by the choice. Do not send other workspaces’ text in the same request. A failed embedding fails the job. It does not mark the document Ready.

## 14. AI Credits chat API

**Purpose.** Generate the grounded reply, the clarification, or the decision to escalate.

**Why.** The PRD specifies an OpenAI-compatible chat API billed as AI Credits, not the OpenAI chat API itself.

**Integration.** FastAPI calls it through LangChain with a base URL that is not OpenAI’s. Embeddings stay on OpenAI. The two credentials and the two hosts are different. The model is asked only after retrieval, and only on AI Active. The policy is fixed: published information, clarification when the question is too broad, escalation when evidence is weak, conflicting, or needs a business decision. Refunds, payments, discounts, cancellations, and policy exceptions are not approved.

**Dependencies and configuration.** Base URL, credential, and model name. The model name is Open. Whether that endpoint supports the JSON or tool-calling shape LangChain will use is untested. Confirm it before locking the prompt format.

**Security and reliability.** A timeout or an error stores provider failure and offers a person. The conversation moves to Pending Human for that failure. No partial model text is stored as the answer. Keys stay on the API process.

## 15. FastAPI WebSockets

**Purpose.** Push a message that is already stored to the visitor widget and the agent inbox.

**Why.** The PRD requires live delivery from the API process, after the write. PartyKit and Redis pub/sub are out.

**Integration.** The client sends a message on HTTP or on the socket only as a trigger. The server inserts the row first. The socket then receives the stored row. On connect, the client sends the last stored id it has and receives anything newer. Presence for the email decision is “the visitor socket is connected.” There is no separate presence service.

**Dependencies and configuration.** Uvicorn’s standard extras, already installed, include WebSocket support. The API holds connection maps in memory, keyed so a broadcast cannot cross workspaces or conversations. One API instance is assumed, because those maps are not shared.

**Security and reliability.** The socket handshake validates the same visitor, resume, or Neon Auth credential as HTTP. A socket that authenticated for conversation 1 does not receive conversation 2. A dropped socket does not delete rows. Reconnect is the recovery path.

## 16. Transactional email

**Purpose.** When an agent replies, the visitor socket is disconnected, and an email address is stored, send one email containing a resume link to that conversation.

**Why.** The human-support flow needs an offline path. The provider is an Open item. Neon Auth’s login mail is not this provider.

**Integration.** FastAPI calls the provider after the reply is stored. Success or failure is visible to the agent. Neither result resolves the conversation or moves it out of Assigned. The link opens one conversation, expires, and can be revoked when a new link is issued. A starting lifetime of 14 days is the PRD’s recommendation, and the number is still Open. If the session already has a current conversation, a message through that link does not start a second one.

**Dependencies and configuration.** None until a provider is chosen. The API should hide the provider behind one send operation so the rest of the inbox does not change when the provider is picked.

**Security and reliability.** The email contains the raw resume secret. The database stores a form that can be matched and revoked without treating the email body as the source of truth. A send failure leaves the reply in the transcript for reconnect. The link does not sign the visitor into Neon Auth and does not authorize any other conversation.

## 17. Cross-cutting rules

These are stack rules, not new products.

**Tenancy.** Workspace id is an application column on documents, jobs, chunks, sessions, conversations, and messages. Isolation is a filter on every query plus the credential check. The two-workspace acceptance test is the proof.

**One membership.** The membership table maps one Neon user id to one workspace and one role. Creating a second row for that user is refused. Role changes update that row. The last owner cannot be removed.

**Visitor credentials.** Issued by the API, stored by the widget, checked by the API. They are not Neon JWTs. A session owns the conversations it started and has at most one that is not Resolved. A resume link names one conversation.

**Idempotent visitor sends.** One send action stores one message even when the client retries. The exact key format is a small open detail. The outcome is not.

**Config separation.** Secrets live in environment variables, not in the snippet and not in the repository. `.env` is gitignored. A `.env.example` is not written yet because several values are still unknown.

**Operational visibility.** Ingestion failure, email failure, and model failure must be visible to the owner or the agent who needs to act. A full analytics product is out of scope. The logging tool is not chosen.

## 18. Unresolved technical decisions

These are the choices this document refuses to pretend are made.

| Decision | Why it is still open | Constraint that already exists |
|---|---|---|
| Chat model name and retrieval cutoff | PRD leaves both to technical design | Section 8 question set is the test, not a similarity number |
| Embedding model and vector dimension | Same Open item, and it locks the pgvector column | Must be one OpenAI embedding model for both indexing and queries |
| Vector index type | HNSW and IVFFlat are both available | Create it only after the dimension is fixed |
| Chunking parameters | Not in the PRD | Deleted and replaced documents must not leave duplicate searchable copies |
| PDF and text parser | Not chosen | No extractable text becomes Failed and stays out of retrieval |
| Email provider | PRD Open item | Failure is visible and does not change status |
| Resume-link lifetime | Start from 14 days, number Open | One conversation, revocable when a new link is issued |
| Invitation expiry | Neon’s organization guide does not publish a lifetime | Who may accept is decided. An owner can cancel a pending invite |
| Auth production SMTP | Shared SMTP can send verification codes for development | Production auth mail needs custom SMTP. Resume email is still a separate provider |
| Prove account linking at milestone 1 | Product rule is closed. Neon does not document automatic linking | One verified email is one user. A second sign-in that would create another user is refused |
| Rate-limit numbers and where counters are stored | Numbers must exist and be configurable | Per workspace, without Redis. Process memory resets on restart. Postgres does not |
| Logo delivery from a private bucket | Public prefix, separate public asset, or refreshed presigned URL | No owner credential in the widget address |
| ORM, database driver, and migration tool | Not chosen | One schema, pooled app traffic, direct migrations |
| Rate of Neon compute suspend | Not chosen | Worker polling and WebSockets need the database awake |
| App and API hosting | Not chosen | One API instance. WebSockets stay on FastAPI, not on a short serverless function |
| Widget bundler and script host | Not chosen | Output is a snippet with public brand fields only |
| Postgres row-level security | Not selected | Application checks are already required |
| Logging and error reporting tool | Not chosen | Failures of ingest, email, and the model must be visible |
| Idempotency key format for visitor sends | Not chosen | One action stores one message |
| AI Credits request format | Endpoint compatibility is unverified | OpenAI-compatible chat, separate from the embeddings host |
| Presigned URL lifetime and S3 lifecycle | Not chosen | Private objects, short-lived signed access |

## 19. Compatibility concerns and risks

**JWT claims are not the role check.** A Managed token expires in 15 minutes. The organization plugin says token claims exist, and the base JWT guide still says there are no custom claims. FastAPI does not grant Owner or Agent from a claim alone. It loads the membership row. A claim that disagrees with that row is refused.

**Fifteen-minute tokens.** An inbox tab that keeps a socket open needs a plan for expiry during the socket’s life. Re-validate on a timer or close the socket when the token expires. Do not turn the socket into a bypass of the 15-minute bound.

**Two model hosts.** An embeddings key sent to the AI Credits base URL, or a chat model name sent to OpenAI embeddings, will fail or silently mismatch dimensions. Configuration should make the two clients impossible to swap by accident.

**LangChain and pgvector.** Use LangChain to call models and to shape the prompt. Do not point a LangChain vector store at a service other than this Postgres database.

**One process for sockets.** A second API replica would deliver live events only to clients connected to the replica that stored the message. Reconnect would still repair history from Postgres. Live delivery would be wrong. V1 stays on one API process.

**Worker versus scale-to-zero.** If Neon suspends compute, a worker poll may sit on a cold start or fail the connection. Ingestion would look stuck while the document stays Processing. Decide suspend behavior before relying on the worker in a demo.

**Delete versus in-flight embed.** The worker can finish an embedding call after the owner deletes the document. The write-back must check that the document and job are still active, or the chunk lands in a deleted document and violates retrieval rules.

**Third-party widget origin.** Customer sites are not the Next.js origin. Neon Auth trusted domains do not cover the widget. Visitor calls are authorized by Respondly credentials and an explicit CORS policy. Do not solve that by putting the visitor on a Neon session cookie.

**Auth mail versus resume mail.** A working Neon login does not mean resume emails send. They are configured and observed separately.

**shadcn in the snippet.** Importing dashboard components into the widget pulls Tailwind and a large client onto the business site. Keep the packages separate.

**Organization plugin.** V1 uses it for the workspace and its invitations, with the membership limit set to 1. It is still beta. Its `member` role is not the Respondly Agent permission set, so FastAPI remains the authorization server. `admin` is unused.
