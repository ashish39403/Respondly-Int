# Owner and agent UI

Next.js App Router, React, TypeScript, Tailwind CSS, and shadcn/ui.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
```

Copy `.env.example` to `.env.local` for Neon Auth. Do not commit `.env.local`.

The dashboard is a public, isolated **demo workspace**. It never fetches business
data, sends messages or invitations, creates ingestion jobs, or changes Neon
accounts. Existing sign-in and `/ready` authentication are separate and unchanged.

| Route | Demo behavior |
| --- | --- |
| `/dashboard` | Home: operational counts, 7/14-day activity chart, current status mix, pending conversations, Ready-document coverage |
| `/dashboard/inbox` | Search, All/Pending/Mine/Resolved views, transcript and sources, claim, human reply, unassign, explicit resolve |
| `/dashboard/knowledge` | Search and status filters, source preview, local file selection/replacement, retry, explicit Simulate Ready, delete |
| `/dashboard/widget` | Assistant name, welcome text, brand color, logo, placement, live visual preview, clearly nonfunctional example installation snippet |
| `/dashboard/team` | Local invitations, role changes, remove/cancel with confirmation, last-owner protection |
| `/dashboard/settings` | Profile photo/name and workspace name preview |

All sections share one reducer in the dashboard layout. Counts and charts derive
from the same seeded conversations, so inbox and document actions update Home.
The historical chart period is explicitly October 12–25, 2026; its data is sample
activity, not a live analytics product. A chart data table is available as a text
alternative. Desktop retains a 30/70 frame; smaller screens use compact navigation
and a conversation list/detail flow.

Changes last across dashboard navigation and reset on refresh. Photos and logos
are decoded locally, never uploaded, and their object URLs are released on cleanup.
Documents accept non-empty PDF/TXT/Markdown files up to 10 MB, with 50 documents
maximum. `Simulate Ready` changes only a demo status; nothing is embedded/indexed.
The `.invalid` widget snippet is deliberately illustrative and cannot be installed.

Run `npm run test:dashboard` with Node 24+ for the reducer and fixture consistency
checks, plus `npm run lint`, `npm run typecheck`, and `npm run build`.
