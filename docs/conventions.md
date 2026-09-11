# Conventions

Repository configuration is the source of truth for formatting, scripts,
aliases, and package behavior.

## General

- Keep changes focused on the requested behavior.
- Use English for identifiers, comments, tests, documentation, and user-facing
  copy.
- Use the domain terms defined in `CONTEXT.md`.
- Represent every reachable loading, empty, error, not-found, and success state.

## Next.js and React

- Treat `src/app` routes and layouts as Server Components by default.
- Add `'use client'` only at the narrow boundary that needs state, effects,
  event handlers, browser APIs, or Zustand.
- Keep secrets and external Product reads behind modules marked `server-only`.
- Resolve `params` and `searchParams` before passing primitive values into a
  cached function.
- Give every `use cache` scope an explicit `cacheLife` and cache only successful
  application data.
- Stream remote work through granular Suspense boundaries and keep recovery in
  the nearest error boundary.
- Pass only serializable, minimal presentation data to Client Components.
- Use `next/link`, `next/image`, App Router navigation, and framework metadata
  rather than browser-only substitutes.
- Prefer composition and explicit props over components controlled by many
  boolean flags.

## TypeScript and modules

- Preserve strict types from external input to rendered props.
- Treat external values as `unknown` and validate them at the boundary.
- Declare explicit types for exported contracts and infer local implementation
  types.
- Prefer discriminated unions for alternative states, string unions over enums,
  and `import type` for type-only imports.
- Use named exports except for framework entry points.
- Keep server and client entry points explicit; avoid broad feature barrels.

## UI and styling

- Read `DESIGN.md` before changing UI or styles and validate relevant Figma
  frames when composition changes.
- Treat `DESIGN.md` as the visual contract and `src/app/globals.css` as the
  centralized CSS implementation. Reconcile deliberate behavior changes in
  both places instead of allowing them to drift.
- Keep design tokens, resets, shared selectors, and feature styling in
  `src/app/globals.css`. Group the file in this order: tokens, base behavior,
  shared shell, Catalog, Product detail, Cart, responsive rules, then motion and
  input-capability overrides. Omit an empty feature section when it uses only
  local utility classes.
- Use semantic HTML, associated labels, keyboard support, visible focus, useful
  alternatives, live announcements, and reduced-motion handling.
- Build mobile-first and protect the five configured reference/intermediate
  viewports from overflow.
- Reuse existing UI primitives and Tailwind utilities for small, local
  composition. Do not introduce CSS Modules unless the repository-wide styling
  strategy is deliberately changed and documented.

## Tests

- Test pure rules and adapters with Vitest and observable client interaction
  with Testing Library.
- Do not mount asynchronous Server Components in Vitest; validate their route
  composition with Playwright.
- Query UI by role, label, or visible text and interact as a user would.
- Keep fixtures explicit and deterministic. Filter transport assertions to the
  boundary they intend to protect.
- Run E2E against `next build` and `next start` with the local Product API
  fixture, never the live challenge service.
- Fail journeys on unexpected console output, page errors, failed requests,
  HTTP errors, axe violations, or horizontal overflow.
