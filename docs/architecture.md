# Architecture

This document defines the Next.js application boundaries, ownership, and data
flow. Repository configuration remains the source of truth for installed
versions and scripts.

## Runtime shape

- Next.js 16 App Router and React 19 compose routes from Server Components by
  default.
- Cache Components produces a static shell while Suspense streams Product data.
- Tailwind CSS 4 and shadcn/ui provide styling and primitives.
- Zustand owns shared browser state for the Cart.
- Vitest covers pure and client-island behavior; Playwright covers server route
  composition and end-to-end journeys.

## Boundaries

```text
src/app/                       Route composition, metadata, errors and loading
src/features/products/         Shared contracts and server-only Product data
src/features/catalog/          Catalog server rendering and Search client island
src/features/productDetails/   Detail rendering and interactive configuration
src/features/cart/             Cart rules, persistence, hydration and UI
src/components/shared/         Proven cross-feature composition
src/components/ui/             Product-agnostic UI primitives
src/lib/                       Shared framework infrastructure
src/test/                      Shared Vitest setup
e2e/                           Production application journeys and API fixture
```

- `app` composes features; features do not import route modules.
- Shared components and `lib` do not depend on application routes.
- Server and client entry points stay explicit. Avoid barrels that can pull a
  server-only module into the client graph.
- Tests stay beside the module they exercise; shared support belongs in
  `src/test` or `e2e/support.ts`.

## Product data boundary

`src/features/products/server.ts` imports `server-only` and exposes two server
interfaces:

```ts
getCatalog(query: string): Promise<ProductSummary[]>
getProduct(productId: string): Promise<ProductDetails | null>
```

The boundary reads `API_KEY`, attaches `x-api-key`, and hides transport,
authentication, validation, normalization, deduplication, image repair, and
failure classification. External payloads enter the data core as `unknown` and
leave as application contracts or `ProductDataError`. A missing Product returns
`null`; route composition converts it to `notFound()`.

Live successful reads use `use cache` with `cacheLife('minutes')`, keyed by the
resolved Search query or Product id. Request values are resolved outside the
cached scope and passed as serializable arguments. The E2E fixture deliberately
bypasses the cross-request cache so successive failure and retry outcomes remain
deterministic. No Route Handler or browser proxy is required.

## Server and client composition

Server Components own the root shell, metadata, Catalog cards and results,
Product details, specifications, and similar Products. Client Components are
limited to browser interaction: Search draft/debounce, error retry, Product
configuration, carousel measurement, image fallbacks, Cart hydration, and Cart
actions.

Only serializable presentation data crosses from server to client. Client
modules never import the Product server boundary or read `API_KEY`.

```text
URL params -> App Router -> getCatalog/getProduct -> challenge API
                         -> validated Product contracts -> server rendering

Product configuration -> Product variant -> Cart action -> localStorage
```

## State ownership

| State | Owner |
| --- | --- |
| Confirmed Search query | `search` URL parameter |
| Search draft and pending navigation | Catalog client island |
| Remote Product data | Product server boundary and Next cache |
| Selected color, storage and image | Product configurator |
| Cart lines | Zustand Cart store |
| Persisted Cart snapshot | Versioned `mbst-cart` localStorage entry |
| Cart count and total | Selectors derived from Cart lines |

Cache Components preserves recent route UI with React Activity. Client
hydration and effects must therefore be deterministic when a route becomes
hidden and visible again.
