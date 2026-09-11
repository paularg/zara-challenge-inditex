# MBST Smartphone Store

MBST is a responsive Next.js storefront for browsing and searching smartphone
Products, choosing an exact Product variant, and keeping that selection in a
persisted Cart. Checkout and deployment are intentionally outside this
technical exercise.

## Prerequisites

- Node.js 20.9 or newer; CI uses Node.js 24.
- pnpm 11.9.0, as pinned by `packageManager` in `package.json`.
- A challenge API key for live development.

Install the locked dependencies and create the local environment file:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Replace the placeholder in `.env`:

```dotenv
API_KEY=your_api_key_here
```

`API_KEY` is read only by the Next.js server. It is never exposed through a
`NEXT_PUBLIC_` variable or sent to the browser. `.env` is ignored by Git.

## Development and quality commands

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The repository exposes
each delivery gate independently:

| Purpose                       | Command             |
| ----------------------------- | ------------------- |
| Format files                  | `pnpm format`       |
| Check formatting              | `pnpm format:check` |
| Lint                          | `pnpm lint`         |
| Type-check                    | `pnpm typecheck`    |
| Build for production          | `pnpm build`        |
| Start the production build    | `pnpm start`        |
| Run Vitest                    | `pnpm test`         |
| Run Vitest in watch mode      | `pnpm test:watch`   |
| Run the production E2E matrix | `pnpm test:e2e`     |

Install Playwright browsers before the first local E2E run when needed:

```bash
pnpm exec playwright install chromium chrome msedge firefox webkit
```

## Reviewer guide

The original challenge document is not stored in this repository. Start with
the [reconstructed challenge brief](docs/challenge-brief.md), then read the
[domain glossary](CONTEXT.md), [architecture](docs/architecture.md),
[design system](DESIGN.md), and [conventions](docs/conventions.md). The Product
server boundary, Catalog composition, Product configuration, and Cart rules are
the main implementation seams.

For a quick independent verification, run `pnpm test` followed by
`pnpm test:e2e`. The complete required gate is recorded in
[verification](docs/verification.md), and the same jobs run in
[GitHub Actions](https://github.com/paularg/zara-challenge-inditex/actions).
Visual review uses the Figma file linked from `DESIGN.md`; reviewers need access
to that file separately.

The key decisions are server-only Product access, Cache Components with streamed
Product content, URL-owned confirmed Search, and a versioned browser-owned Cart
that retains captured prices. Checkout, deployment, and a distributed copy of
Helvetica Neue are deliberately excluded.

## Architecture

The application uses the Next.js 16 App Router, React Server Components, and
Cache Components. Route composition and remote Product reads stay on the
server. Client Components are limited to Search interaction, Product variant
configuration, imagery and carousel behavior, Cart hydration, and Cart state.

`src/features/products/server.ts` is the only Product API entry point. It
exports `getCatalog(query)` and `getProduct(productId)`, attaches `API_KEY` as
`x-api-key`, validates external payloads, and delegates normalization to the
Product data core. Successful live reads use `use cache` with
`cacheLife('minutes')`; route-level Suspense boundaries stream dynamic results
inside a prerendered shell. Failures remain recoverable and are not cached as
valid Product data.

Product images use `next/image`. Production allows only the challenge API's
HTTPS `/images/**` path. E2E sets a fixture endpoint and disables image
optimization so Product data and imagery remain deterministic without external
network access.

The Cart is a client-owned Zustand store persisted under `mbst-cart`, using
schema version `1`. Hydration is explicit, corrupt or incompatible state
recovers to an empty Cart, and saved Cart lines retain captured prices without
refetching or repricing Products.

See [architecture](docs/architecture.md), [conventions](docs/conventions.md),
the [domain glossary](CONTEXT.md), and the binding [design system](DESIGN.md)
for the detailed contracts.

## Testing and CI

Vitest covers pure Product normalization, variants, Search helpers, Cart rules,
and Client Component integration. Asynchronous Server Component composition is
covered through Playwright against `next build` and `next start`.

Playwright starts a local Product API fixture, uses a non-secret test key, and
runs the responsive matrix in Chromium, Google Chrome, Microsoft Edge, Firefox,
and the complete iPhone 15 Mobile Safari/WebKit profile. The journeys include
axe WCAG 2.2 AA, keyboard, focus, console, network, persistence, deep-link, and
overflow checks.

`.github/workflows/quality.yml` runs format, lint, typecheck/build, Vitest, and
Playwright as independent jobs with a frozen lockfile. Failed E2E runs upload
the HTML Playwright report. CI performs no deployment.

## Deliberate limitations

- `PAY` is enabled but has no checkout or payment action.
- No deployment or hosting configuration is included.
- Live Product data and images depend on the challenge API's availability.
- Helvetica Neue is used when locally available and is not distributed; Arial
  and the generic sans-serif fallback preserve a reproducible build.
- Cart data is persisted per browser origin and is not shared across different
  domains or ports.
