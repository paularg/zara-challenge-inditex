<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Instructions

## Delivery

- Leave changes uncommitted for user review. Commit or open a pull request only
  when the user explicitly requests it.

## Context router

- **Domain** — Read `CONTEXT.md` before changing Product, Product variant, Cart
  line, or Cart behavior; use its canonical vocabulary.
- **Design** — Read `DESIGN.md` and inspect the relevant linked Figma frames
  before changing UI, styling, responsive composition, assets, or interaction.
- **Architecture** — Read `docs/architecture.md` before changing boundaries,
  dependencies, state ownership, data flow, caching, or server/client placement.
- **Conventions** — Read `docs/conventions.md` before changing source code,
  tests, accessibility, naming, or user-facing copy.
- **Verification** — Read `docs/verification.md` before validating or reporting
  any repository change as complete.

## Product API

- Read `openapi.json` before changing Product integration or contracts.
- Keep Product fetches and `API_KEY` inside the explicit `server-only` boundary.
  Pass resolved primitive inputs into cached functions and keep Client
  Components free of transport details.
