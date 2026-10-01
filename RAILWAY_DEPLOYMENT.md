# Single-service Railway deployment

## 1. Create the services

Create one Railway project with:

1. A PostgreSQL service.
2. One application service rooted at the repository root.
3. A public domain on the application service.

The committed `railway.json` runs `npm ci && npm run build`, applies migrations with `npm run migrate`, starts Fastify with `npm start`, and checks `/health`. Fastify serves both `/api/*` and `frontend/dist`, including an HTML5 SPA fallback for routes such as `/admin`.

## 2. Configure server variables

Set these on the Railway application service only:

```text
DATABASE_URL=<reference the PostgreSQL private DATABASE_URL>
DATABASE_SSL=disable
PUBLIC_API_URL=https://<application-domain>
ADMIN_USERNAME=<private administrator username>
ADMIN_PASSWORD=<private random password of at least 12 characters>
SESSION_TTL_HOURS=8
REQUEST_BODY_LIMIT_BYTES=11534336
HOST=0.0.0.0
NODE_ENV=production
```

Railway supplies `PORT`. Use `DATABASE_SSL=require` only when the selected database endpoint requires TLS. Production uses one origin, and the frontend ignores `VITE_API_URL` outside Vite development; omit `FRONTEND_ORIGINS` and `VITE_API_URL` in Railway. Never expose database or administrator values through `VITE_*` variables.

For optional local Vite development against Fastify on another origin, set `VITE_API_URL=http://localhost:3000` in the frontend environment and add the exact Vite origin (for example `http://localhost:8443`) to backend `FRONTEND_ORIGINS`. Wildcards and URL paths are rejected.

## 3. Build, migrate, and start

The root scripts are the deployment contract:

```text
npm ci
npm run build
npm run migrate
npm start
```

A successful deployment must report HTTP 200 from `/health`, `database: "ready"`, `migrations.current: true`, and expected migration `003`. The migration command is transaction-locked and validates complete version/name/checksum history; a removed, renamed, or changed applied migration blocks readiness and deployment.

The shared PostgreSQL login counter protects the administrator identity across Railway instances and changing IP addresses. Its five-attempt window expires after one minute, while separate IP controls remain active.

## 4. Production smoke checklist

- `/health` is HTTP 200 and reports all three migrations current.
- `/` loads the built React site from Fastify without `VITE_API_URL`.
- Direct visits and refreshes at `/admin`, `/donate`, and a nested news path return the SPA; unknown `/api/*` paths remain JSON 404 responses.
- Public `GET /api/content` omits disabled focus areas, inactive campaigns, draft news/reports, non-public documents, all asset URLs belonging to those hidden records, disabled announcement copy/links, paused transfer destinations, and every campaign nested under disabled fundraising.
- Authenticated `GET /api/admin/content` returns the complete unredacted editor document; unauthenticated administrator reads/writes return the standard 401 envelope.
- The contact-form credential shortcut succeeds only with Railway credentials. Invalid credentials, an API timeout, and a normal valid enquiry continue to the ordinary Prepare Email behavior without revealing the hidden route.
- Direct `/admin` refresh restores and revalidates a live session; logout, expiry, revocation, and credential rotation block it.
- Allowed image/PDF uploads return same-service absolute URLs and survive redeployment; spoofed, disallowed, and over-10-MiB files fail.
- Monthly/yearly donation reads require authentication, return only paid rows, cap results at 5,000, and include `Cache-Control: no-store`.
- CSV exports open formula-looking donor fields as text rather than formulas.
- “Preview thank-you certificate” opens a native modal dialog containing obvious sample/preview markings. Check that forward Tab and reverse Shift+Tab remain inside the dialog, Escape and backdrop click close it, focus returns to the preview opener, and Browser Print/Save as PDF prints only the marked certificate without implying payment verification.
- Every file under `frontend/public/documents/` opens successfully and matches the pre-move hashes in `.agents/tasks/railway-backend-migration/move-evidence.json`.

## 5. Backup and recovery

Enable Railway PostgreSQL backups and periodically test restoration. Before imports or major CMS edits, create a backup and record the current health response. For recovery, stop writes, restore the selected snapshot (preferably into a replacement service), update `DATABASE_URL` if needed, run `npm run migrate`, redeploy, and complete the smoke checklist before resuming edits.

For a disposable staging migration check, point `DATABASE_URL` at a temporary Railway PostgreSQL database and run:

```text
npm ci
npm run build
npm run migrate
npm run migrate
```

Then assert exactly one `site_content` row with `id='main'`, exactly one seeded revision before any editor writes, and confirm that changing, renaming, or removing an applied migration causes both `npm run migrate` and `/health` to reject the history. Destroy the temporary database after recording the results.
