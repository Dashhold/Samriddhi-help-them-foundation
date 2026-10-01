# Repair result

## Completed

- Converted the repository to an npm monorepo with `frontend/` and `backend/`.
- Configured one root Railway service to install/build both workspaces, migrate PostgreSQL, start Fastify, serve `frontend/dist`, and provide SPA fallback without shadowing `/api`.
- Made production browser API calls same-origin; `VITE_API_URL` is optional for separate local Vite development only.
- Removed the complete legacy platform directory/importer/instructions and former frontend-host config/instructions.
- Preserved all eight governance documents byte-for-byte and verified both source and built copies against SHA-256 evidence.
- Pinned Fastify `5.12.5`, compatible Fastify plugins, static serving, and Vite `8.3.2`; one root lockfile is current.
- Split public visibility-projected CMS reads from protected full administrator reads.
- Added shared PostgreSQL username-hash login throttling across IPs/instances while retaining IP controls and a one-minute bounded lockout.
- Added `Cache-Control: no-store` to protected donor reports.
- Neutralized spreadsheet-formula prefixes after leading whitespace/control characters.
- Strengthened complete migration history/readiness checks and deleted/renamed/changed-history tests.
- Added a branded, responsive, print/PDF-friendly thank-you certificate preview that is unmistakably sample-only; real details require a paid donation record.

## Validation

- Clean `npm ci`: pass (one transient Windows `EBUSY`, immediate retry passed).
- Root production build: pass; frontend 54 modules, backend TypeScript pass.
- Focused tests: 20 passed, 0 failed.
- Frontend/backend strict type checks: pass.
- Formatter check: pass, 39 files.
- Production audit: 0 vulnerabilities.
- Full audit: 0 vulnerabilities.
- Static reference/layout/document-hash validation: pass.

## Deployment

Create one Railway application service at the repository root plus one PostgreSQL service. Use the committed `railway.json`. Set server-only `DATABASE_URL`, `DATABASE_SSL`, `PUBLIC_API_URL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`; optional tuning values are documented in `.env.example`. Do not set `VITE_API_URL` in same-origin production.

## Remaining environment-only checks

A disposable PostgreSQL apply-twice exercise was not possible because Docker's daemon is stopped, `psql`/a local PostgreSQL service are absent, and `DATABASE_URL` is unset. Browser automation and a deployed Railway URL/credentials are also unavailable. Exact disposable-database commands and the live smoke matrix are in `verification.md` and `RAILWAY_DEPLOYMENT.md`.
