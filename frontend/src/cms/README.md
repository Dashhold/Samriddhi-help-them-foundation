# Samriddhi content layer

`CmsProvider` exposes one typed content model to public and admin components. Its transport is the standalone Railway API backed by Railway PostgreSQL.

## Runtime behavior

- Public pages render bundled defaults immediately, then hydrate from `GET /api/content`.
- If `VITE_API_URL` or the network is unavailable, public pages retain the safe bundled fallback.
- The admin gate opens editors only after the API verifies the bearer session and remote content loads.
- Admin writes use optimistic revision matching, preventing one session from silently overwriting a newer revision.
- Lightweight polling plus focus/visibility refresh keeps already-open public pages current.
- Every successful write creates a row in `site_content_revisions` in the same transaction.

## Content and financial data separation

Editable public copy, news, fundraising appeals, donation display settings and public report metadata live in the CMS JSON document. Verified donation transactions remain in the separate protected `donations` ledger. No payment gateway is implemented.

## Assets

Admin image/PDF controls upload through `POST /api/admin/assets`. Allowed files are validated and stored as PostgreSQL `bytea`, so they survive Railway service redeploys; public immutable asset URLs are served by the API.

See `RAILWAY_DEPLOYMENT.md` for deployment and administrator setup.
