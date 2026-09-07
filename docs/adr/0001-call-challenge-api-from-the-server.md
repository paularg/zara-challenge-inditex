---
status: accepted
---

# Call the challenge API from the server

The Next.js application reads Product data exclusively through a `server-only`
module and attaches `API_KEY` on the server. This keeps credentials out of the
browser while retaining direct access to the challenge API; no Route Handler or
backend-for-frontend is added because only Server Components consume the remote
data, and explicit caching controls the additional server work.
