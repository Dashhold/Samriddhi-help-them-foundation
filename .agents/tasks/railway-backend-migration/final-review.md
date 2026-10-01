# Single-service Railway application with PostgreSQL administration and certificate preview

The application is organized as a React/Vite `frontend/` and Fastify/PostgreSQL `backend/`, with one root Railway service building and serving both. Active Supabase and Vercel dependencies are removed, governance assets are preserved, and PostgreSQL now backs administration, uploads, donor reporting, and shared login throttling. Three confirmed medium-severity issues remain in public CMS projection, production API-origin enforcement, and modal keyboard isolation. They conflict with explicit publication, same-origin, and accessibility requirements.

**Watch for:** **confirmed, MEDIUM** — pausing donations or hiding boolean-gated CMS sections does not remove their details from the public API; **confirmed, MEDIUM** — a production `VITE_API_URL` overrides same-origin routing and can receive administrator credentials and bearer tokens; **confirmed, MEDIUM** — the certificate dialog declares itself modal without containing focus or making the background inert.

**Verdict**: NEEDS_CHANGES

## High-level view

The root workspace and `railway.json` provide a single-service contract: build both workspaces, migrate before deploy, start Fastify, and gate rollout on `/health`. Fastify serves only `frontend/dist`; registered `/api/*` routes retain precedence, non-API HTML navigation receives the SPA shell, and no request value becomes a filesystem path.

The prior Fastify advisory, account-wide guessing gap, donor caching, CSV formula injection, and migration-history defects are repaired in current source. **Confirmed, MEDIUM:** the public CMS fix filters status-based collections but leaves boolean-hidden announcement and donation fields intact, including transfer destinations while donations are paused.

**Confirmed, MEDIUM:** `frontend/src/lib/api.ts` gives `VITE_API_URL` precedence even in production, despite documentation defining it as development-only. A stale or hostile build variable can reroute login, bearer-authenticated requests, uploads, and donor reads off origin.

The certificate link is immediately after the home donation CTA, and the printable certificate retains sample/payment-disclaimer markings. **Confirmed, MEDIUM:** initial focus, Escape, and focus return work, but Tab can reach operable controls behind the overlay because neither a focus boundary nor inert background is implemented.

Recorded evidence shows the build, 20 focused tests, strict checks, formatter check, and both dependency audits passing with Fastify `5.12.5`. Live PostgreSQL apply-twice and deployed-browser checks remain staging limitations because no database, Railway URL, or browser automation was available; they are not treated as source defects.

<details>
<summary>Issues (3)</summary>

1. **Boolean-gated CMS disclosure (MEDIUM, confirmed)** — `/api/content` still serializes paused QR/UPI/bank destinations and disabled announcement fields. Redact parent-hidden values in the public DTO and add raw-response regression coverage.
2. **Production API-origin override (MEDIUM, confirmed)** — a production `VITE_API_URL` supersedes relative same-origin paths and can receive login credentials, bearer tokens, uploads, and donor data. Restrict the override to development or reject a production origin different from `window.location.origin`.
3. **Certificate modal focus escape (MEDIUM, confirmed)** — the dialog handles initial focus and Escape but allows Tab into operable background controls. Use native modal-dialog behavior or implement focus containment plus an inert background and browser-check forward/reverse Tab.

</details>

<details>
<summary>Details</summary>

## One Railway process owns API, SPA, assets, and readiness

```text
Railway public domain
        |
        v
Fastify / Node 22  ----->  Railway PostgreSQL
   |        |                    |-- migrations and readiness
   |        |                    |-- admin/session/rate-limit state
   |        |                    |-- CMS revisions and uploaded bytes
   |        |                    `-- paid donor records
   |        `-- /api/* routes
   `-- frontend/dist + non-API SPA fallback
```

`package.json:7-19` defines the two workspaces and root commands. `railway.json:3-15` builds before pre-deploy migration, starts the compiled backend, and checks `/health`; `backend/src/routes/health.ts:10-49` compares complete discovered/applied migration histories. The constant frontend root and `index.html` fallback in `backend/src/app.ts:20,61-76` avoid path traversal and exclude `/api` and `/api/*`; retained injection evidence confirms real API routes win and unknown API routes remain JSON 404s.

The only files under `frontend/public/` are the eight expected governance documents, whose current lengths match `move-evidence.json`; retained source/build hashes also match. Direct filesystem and scoped source checks find no legacy root source/public tree, `supabase/`, `vercel.json`, pnpm lock, nested backend lock, or active Supabase/Vercel reference. The local `.env` was not opened; `.gitignore` covers it with `.env*`, explicitly preserves only `.env.example`, and that example still contains placeholders rather than credentials.

## Public CMS projection stops at record status

**Confirmed, MEDIUM:** `backend/src/content/repository.ts:29-41` starts the public response with `...content` and replaces only focus areas, campaign status, news status, document visibility, and report status. `announcement` and `donation` pass through unchanged, and active campaign data remains serialized when the parent fundraising section is disabled. The protected `/api/admin/content` split closes the tested record-level leaks but not all publication switches.

`frontend/src/admin/sections/DonationSection.tsx:50-56` defines the availability toggle as a pause while payment details are changed or verified and says it controls QR, UPI, and bank visibility. `frontend/src/pages/DonatePage.tsx:115-173` hides those controls when `acceptingDonations` is false, but unauthenticated `GET /api/content` still returns `qrImageUrl`, `upiId`, account number, IFSC, branch, and related values. Callers can recover stale or explicitly unverified transfer destinations while the UI says donations are paused. Disabled announcement copy and links are exposed by the same shape, and `backend/src/tests/api.test.ts:264-330` does not exercise either boolean gate.

Create a public DTO that redacts fields hidden by parent switches while retaining the full document behind `/api/admin/content`. At minimum, paused donation responses must omit transfer destinations, and regression tests must prove paused values and disabled announcement URLs are absent from raw JSON.

## Production `VITE_API_URL` can reroute administrator secrets

**Confirmed, MEDIUM:** `frontend/src/lib/api.ts:1-21` reads `VITE_API_URL` without a development-mode guard, and lines 52-54 choose it before the production relative path. Same-origin behavior therefore depends on the variable being absent, contrary to `.env.example`, `backend/README.md`, and `RAILWAY_DEPLOYMENT.md`.

The shared helper carries hidden-login credentials, opaque bearer tokens, protected CMS data, uploads, and donor PII. If a stale or compromised build setting names another HTTPS origin, that server can permit the preflight and collect those requests. Operator documentation does not enforce the security boundary.

Ignore the override unless `import.meta.env.DEV` is true, or reject a production origin different from `window.location.origin`; add a build or unit assertion for the production case.

## Certificate preview is sample-safe but not keyboard-modal

The control at `frontend/src/pages/HomePage.tsx:460-471` follows the donation CTA section directly. The printed certificate retains its visible preview notice, watermark, placeholder identity/reference, and not-a-receipt disclaimer; `frontend/src/payments/certificate.ts:19-38` also rejects every record not marked paid with `paidAt`, while the public modal passes no record.

**Confirmed, MEDIUM:** `frontend/src/components/CertificatePreviewModal.tsx:18-33` focuses Close, handles Escape, and restores the opener, but implements no Tab loop, native `showModal()`, or inert background despite `aria-modal="true"` at lines 38-42. Keyboard focus can move into visually obscured navigation and donation controls behind the overlay.

Use native `<dialog>.showModal()` or add a complete focus boundary and inert background, preserving Escape and focus restoration. Cover forward/reverse Tab, Escape, backdrop closure, and return focus in the deployment browser check.

## Prior blocker closure and retained evidence

Fastify is pinned to `5.12.5` in `backend/package.json:19-30` and `package-lock.json:1551-1554`, with zero vulnerabilities recorded by both audits. `backend/src/routes/auth.ts:32-65` uses a PostgreSQL username hash independent of IP alongside the IP limiter; `backend/src/routes/donations.ts:20-32` sets `no-store`; `frontend/src/payments/contracts.ts:51-56` neutralizes formula prefixes after whitespace/control characters; and `backend/src/migrate.ts:54-100` rejects applied entries that are deleted, renamed, or checksum-changed while readiness also requires equal history counts.

The public collection tests prove disabled focus areas, inactive campaigns, draft news/reports, non-public documents, and their URLs are removed. The remaining public-projection issue is the untested parent-switch behavior above. Existing validation was inspected rather than rerun, as requested.

</details>

<details>
<summary>File map</summary>

- `package.json`, `package-lock.json`, `railway.json`, `.mise.toml` — workspace, exact dependency graph, Node target, and Railway commands.
- `backend/src/app.ts`, `server.ts`, `config.ts`, `routes/health.ts` — API/static composition, environment parsing, lifecycle, and readiness.
- `backend/src/auth/**`, `routes/auth.ts`, `migrations/003_admin_login_rate_limits.sql` — bootstrapped credentials, sessions, authorization, and shared throttling.
- `backend/src/content/**`, `routes/content.ts` — revisioned CMS and public/admin projections.
- `backend/src/routes/assets.ts`, `assets/repository.ts`, `routes/donations.ts`, `donations/repository.ts` — durable uploads and donor reporting.
- `backend/src/migrate.ts`, `backend/migrations/**` — schema, seed, and history enforcement.
- `frontend/src/lib/api.ts`, `auth/**`, `cms/**`, `payments/**` — API selection, sessions, CMS client, exports, and certificate gating.
- `frontend/src/pages/HomePage.tsx`, `pages/DonatePage.tsx`, `components/CertificatePreviewModal.tsx`, `components/ThankYouCertificate.tsx`, `index.css` — hidden login, donation flow, certificate placement, modal, and print behavior.
- `frontend/public/documents/**` — eight preserved governance assets.
- `.env.example`, `README.md`, `backend/README.md`, `RAILWAY_DEPLOYMENT.md` — deployment contract and smoke procedure.

No Git diff exists; review scope is the current source map in `verification.md`, implementation/prior-review artifacts, and retained validation evidence.

</details>
