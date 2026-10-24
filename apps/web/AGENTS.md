# apps/web

Owner and agent UI only. Before editing, read [../../AGENTS.md](../../AGENTS.md) and [../../docs/IMPLEMENTATION_PLAN.md](../../docs/IMPLEMENTATION_PLAN.md).

- Next.js App Router in `src/app`. Import alias `@/*`. TypeScript `strict` stays on.
- Tailwind 4 is loaded by `@tailwindcss/turbopack` in `next.config.ts`. Do not add a second CSS pipeline.
- shadcn/ui is initialized (`components.json`, `src/lib/utils.ts`). Add a component only when a milestone screen needs it.
- Do not install animation libraries, a second component kit, or Neon Auth until the implementation plan’s milestone says so.
- The home page is a placeholder. Do not turn it into a marketing page unless asked.
- Do not call FastAPI with the Neon session cookie. Business requests use a bearer token.
- Do not share this package with `apps/widget`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
