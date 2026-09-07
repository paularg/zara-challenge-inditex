# Verification

Verify the final working tree before reporting a repository change as complete.
Use repository configuration as the source of truth for commands.

## Gate

1. Inspect the final diff and account for every changed file and affected
   boundary.
2. Run each applicable check independently and sequentially after the last
   change:

   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm test:e2e
   ```

3. Confirm the build reports the expected Partial Prerender shell and completes
   without reading live Product data.
4. Reinspect the tree for secrets, generated artifacts, starter residue,
   external requests, and accidental changes.

A missing required check is `BLOCKED`, not a pass. Fix failures and rerun the
failed check plus every downstream check the fix can affect.

## Browser verification

Playwright must exercise the production build with the local Product API
fixture. The configured matrix owns the five protected viewports, Chromium,
Google Chrome, Microsoft Edge, Firefox, and the complete iPhone 15 Mobile
Safari/WebKit profile.

Relevant journeys must cover loading, success, empty, not-found, invalid data,
network failure, retry, refresh, deep links, history, persistence, and image
failure. Check keyboard interaction, focus, accessible names, axe WCAG 2.2 AA,
reduced motion, console/page errors, failed or unexpected requests, and
horizontal overflow.

The fixture must receive the non-secret E2E key on every Product request. No
Product or image request may reach an external host during the automated suite.

## Completion standard

Record each check as `PASS`, `N/A`, `BLOCKED`, or `FAIL`. Report exact commands,
versions, test counts, browser projects, expected skips, warnings, and remaining
risks in the delivery handoff. Completion requires every applicable check to be
`PASS` or a justified `N/A`.
