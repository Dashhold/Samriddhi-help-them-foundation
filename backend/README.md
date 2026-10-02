# Samriddhi Railway web service

Node.js 22/TypeScript API for the Samriddhi Help Team Foundation site, deployed as its own Railway service with Root Directory `/backend`. PostgreSQL stores administrator sessions, CMS content, uploaded assets, and donation records. The frontend is a separate Railway service.

## Commands

Run from this folder:

```text
npm ci
npm run build
npm test
npm run migrate
npm start
```

`npm start` applies pending migrations and then starts the API, so a Railway deploy needs no separate migration step. `npm run migrate` takes a PostgreSQL advisory transaction lock, compares complete applied/source version, name, and checksum history, and is safe to repeat. `GET /health` returns HTTP 200 only when PostgreSQL is reachable and the complete migration history (currently through `003`) is applied unchanged.

## Server variables

- `DATABASE_URL`: Railway PostgreSQL connection string; prefer the private project reference.
- `DATABASE_SSL`: `disable` for Railway private networking, or `require` for an endpoint requiring TLS.
- `PUBLIC_API_URL`: optional public origin of this backend, used for uploaded-asset links. Defaults to `https://$RAILWAY_PUBLIC_DOMAIN`.
- `FRONTEND_ORIGINS`: optional comma-separated frontend URLs allowed by CORS, for example `https://your-frontend.up.railway.app`. When empty, any origin is allowed.
- `ADMIN_USERNAME`: private environment-managed administrator username.
- `ADMIN_PASSWORD`: private random password of 12–512 characters.
- `SESSION_TTL_HOURS`: optional; defaults to 8 and is capped at 168.
- `REQUEST_BODY_LIMIT_BYTES`: optional; defaults to 11 MiB and must support the 10 MiB upload limit.
- `PORT`, `HOST`, `NODE_ENV`: Railway supplies `PORT`; bind `HOST` to `0.0.0.0`.

Never expose database or administrator values through a `VITE_*` variable. The frontend service only needs `VITE_API_URL`, set to this backend's public URL.

## Authentication model

Login returns a random opaque bearer token. The browser keeps it in `sessionStorage`; PostgreSQL stores only its SHA-256 hash. Sessions are short-lived, server-revocable, checked against account state and credential version, and invalidated whenever Railway administrator credentials rotate. Passwords are stored only as Argon2id hashes. Authorization headers, credentials, tokens, and query details are redacted from logs.

Login retains per-IP controls and atomically increments a normalized-username SHA-256 key in PostgreSQL. This shared control applies across Railway instances and changing source IPs, allows five attempts per minute, resets automatically, and removes stale keys after one day. It cannot create a permanent administrator lockout.

## Routes

Public:

- `GET /health`
- `GET /api/content` — visibility-projected content only
- `GET /api/assets/:id/:filename`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Administrator bearer token required:

- `GET /api/auth/session`
- `GET /api/admin/content` — complete editor document
- `PUT /api/admin/content`
- `POST /api/admin/assets`
- `GET /api/admin/donations?period=monthly|yearly&value=...`

Public content omits disabled focus areas, inactive campaigns, draft news and reports, non-public documents, and their private asset URLs. Donation reports are paid-only, capped at 5,000 rows, and sent with `Cache-Control: no-store`. Uploads are limited to 10 MiB and require an allowed image/PDF MIME type plus a matching file signature. There are intentionally no public payment-write, webhook, paid-status mutation, receipt-generation, or report-export endpoints.

## Backup and operations

Enable Railway PostgreSQL backups and periodically test restoration. Before a major content change, create a backup and record `/health`. To restore, stop writes, restore into a replacement database when possible, update `DATABASE_URL`, run `npm run migrate`, redeploy, then verify health, public and administrator content, an uploaded asset, login/logout, and donation reporting.

Audit `admin_audit_log`, expired sessions, revision growth, asset size, and donation-data retention. Static governance files live in `frontend/public/documents/` and are served by the frontend service.
