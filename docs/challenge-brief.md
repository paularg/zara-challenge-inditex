# Reconstructed Challenge Brief

> This is a non-official reconstruction of the technical exercise. It exists
> to give reviewers a concise statement of intent when the original challenge
> document is not available in the repository.

## Sources and precedence

This brief was reconstructed from the earlier implementation plan, the supplied
Figma file, `DESIGN.md`, `openapi.json`, and the behavior verified by the current
Next.js application. When sources disagree, use this order:

1. Explicit reviewer or challenge-owner decisions.
2. The original challenge document, if it becomes available.
3. This reconstructed brief for functional scope.
4. `DESIGN.md` and Figma for visual behavior and responsive composition.
5. `openapi.json` and observed challenge API behavior for Product data.

## Objective

Build a responsive smartphone storefront where a customer can browse and
search Products, inspect a Product, select an exact Product variant, and keep
that selection in a persisted Cart.

## Routes and functional scope

| Route | Responsibility |
| --- | --- |
| `/` | Display the initial Product catalog and URL-backed Search. |
| `/?search={query}` | Preserve a shareable and restorable confirmed Search. |
| `/products/{productId}` | Display Product details and configure a Product variant. |
| `/cart` | Display the persisted Cart, quantities, total, and empty state. |

The Catalog displays the first 20 unique Products in API order. Search is
debounced, stored in the URL, and supports clear, refresh, history, empty,
failure, and retry states. Product cards open their matching detail route.

Product detail displays commercial information, specifications, color and
storage choices, pricing, and similar Products. Color and storage are both
required before adding to the Cart. Storage supplies the final unit price and
color supplies the selected image.

A Cart line is identified by Product, color, and storage. Adding the same
Product variant increments its quantity; a different variant creates a separate
line. Cart data is versioned in local storage, invalid data recovers safely, and
saved prices are not refreshed or repriced from the API.

## Integration and quality requirements

- Read Product data through a server-only module and never expose `API_KEY` to
  the browser.
- Treat remote payloads as unknown, validate consumed fields, deduplicate
  Product ids, repair HTTP image URLs, and expose recoverable failure states.
- Use a static shell with streamed remote Product content where supported by
  the framework architecture.
- Match the Figma-derived 393 px, 834 px, and 1920 px compositions; keep 768 px
  and 1280 px usable without horizontal overflow.
- Target WCAG 2.2 AA with semantic controls, keyboard support, visible focus,
  accessible names, live announcements, useful image alternatives, and
  reduced-motion behavior.
- Keep automated tests deterministic by using the local Product API fixture and
  preventing Product or image traffic to external hosts.

## Acceptance criteria

The delivery is review-ready when formatting, linting, type checking, unit and
integration tests, the production build, and the complete browser matrix pass.
Catalog, detail, Search, Cart, deep-link, history, persistence, failure, retry,
keyboard, accessibility, reduced-motion, and responsive journeys must remain
covered without unexpected console, page, request, or overflow failures.

## Deliberate exclusions

- Checkout and payment processing.
- Production deployment and hosting configuration.
- Customer accounts or server-side Cart synchronization.
- Pagination, filtering, and sorting beyond the required Search behavior.
- Bundling the proprietary Helvetica Neue font.
