# Railway PostgreSQL backend and bearer-gated administration

The implementation replaces the Supabase runtime with a standalone Fastify service, PostgreSQL migrations, durable database-backed assets, and an API-based Vercel client. Railway-only credentials bootstrap an Argon2id administrator, and opaque bearer sessions gate CMS mutations, uploads, session verification, and donation reads. The frontend retains bundled-content fallback, explicit and hidden administrator entry paths, and no browser payment-write surface. Verification records passing focused tests and production builds, but also an unresolved production advisory and missing runtime checks.

**Watch for:** **confirmed, HIGH** — the deployed Fastify version has an unresolved high-severity advisory; **confirmed, MEDIUM** — public CMS reads expose draft/hidden records; **confirmed, MEDIUM** — login throttling is not account-wide; **confirmed, MEDIUM** — donor responses lack `no-store`; **confirmed, MEDIUM** — CSV exports permit spreadsheet formulas; **confirmed, MEDIUM** — deleted migration files are not detected; **confirmed, MEDIUM** — migrations were not exercised on PostgreSQL; **confirmed, LOW** — the hidden contact flow lacks a browser smoke test.

**Verdict**: NEEDS_CHANGES

## High-level view

Administrative routes converge on a session lookup that checks the token hash, revocation, expiry, account state, and credential version; login failures are generic and credential rotation revokes sessions. **Confirmed, MEDIUM:** the username-focused limiter also includes the source IP, so changing source addresses bypasses an account-wide throttle.

The revisioned CMS document preserves atomic edits, but its public/admin read boundary is not separated. **Confirmed, MEDIUM:** `GET /api/content` sends the complete document and relies on React to hide inactive campaigns, draft news/reports, and non-public documents, exposing those records and their asset URLs to direct callers.

Secrets stay in server configuration, passwords and session tokens are persisted only as hashes, exact browser origins are matched without credentialed CORS, and the API client pins bearer requests to one normalized origin. Uploads enforce the server-side 10 MB limit, MIME/signature checks, constrained filenames, and safe response headers. Runtime SQL values are parameterized; raw execution is limited to repository-controlled migration text.

Donation reads are authenticated, paid-only, and capped. **Confirmed, MEDIUM:** responses containing donor PII do not opt out of caching, and downloaded CSV fields are quoted but not neutralized against spreadsheet formula execution.

Migrations are transactional, lock-protected, checksum-aware for source files that still exist, and seed one `main` row/revision repeatedly. **Confirmed, MEDIUM:** source deletion is not compared against applied history, and **confirmed, MEDIUM:** the planned apply-twice validation never ran on PostgreSQL. **Confirmed, HIGH:** the internet-facing service also remains pinned to the Fastify version that the verification audit identifies as vulnerable.

The Send Message shortcut has no client sentinel: success stores only an opaque session and enters a gate that revalidates it, while every failure resumes native validity and ordinary `mailto:` preparation without an admin-specific message. **Confirmed, LOW:** that interaction was built and inspected but not exercised in a browser.

<details>
<summary>Issues (8)</summary>

1. **Fastify production advisory (HIGH, confirmed)** — `fastify@5.6.2` has the high-severity advisory recorded in verification; upgrade to the fixed line and retest, or complete explicit advisory-specific security acceptance before deployment.
2. **Public draft/private CMS disclosure (MEDIUM, confirmed)** — `/api/content` returns inactive, draft, and hidden entries plus their URLs; project public content and add a protected full-document admin read.
3. **No account-wide login throttle (MEDIUM, confirmed)** — the identity limit includes source IP, so distributed sources reset it; add an independent administrator-identity control and test changing IPs.
4. **Cacheable donor response (MEDIUM, confirmed)** — protected donation JSON containing PII lacks `Cache-Control: no-store`; set and test a no-store policy.
5. **Spreadsheet formula injection (MEDIUM, confirmed)** — CSV quoting does not neutralize formula-leading donor fields; sanitize dangerous prefixes before quoting and cover them with tests.
6. **Deleted migration history accepted (MEDIUM, confirmed)** — migration checks only current source versions, so an applied file can disappear unnoticed; compare both complete version/name/checksum sets and align health readiness.
7. **No PostgreSQL migration exercise (MEDIUM, confirmed)** — the DDL and repeatability check ran only against fake queries; apply twice on a Railway-matching disposable database and retain evidence.
8. **No interactive contact-flow check (LOW, confirmed)** — hidden success/failure and ordinary mail preparation were not browser-smoked; run the documented staging matrix with real credentials.

</details>

<details>
<summary>Details</summary>

## Bearer sessions protect admin operations, but guessing controls remain source-scoped

`PUT /api/admin/content`, `POST /api/admin/assets`, `GET /api/admin/donations`, and `GET /api/auth/session` all use `requireAdmin`. Its lookup rejects missing, revoked, expired, inactive, or credential-version-stale sessions. Bootstrap changes increment the credential version and revoke existing sessions; malformed, unknown-user, and wrong-password login paths expose the same generic 401 response. Logout is token-specific, idempotent, and does not disclose token validity.

Passwords use Argon2id with the 19 MiB/two-iteration profile, while sessions use 32 random bytes and store only SHA-256 token hashes. Logger redaction covers authorization, login fields, tokens, and Postgres query parameters. Static review found only `VITE_API_URL` in browser configuration, with no hardcoded administrator secret or client credential comparison.

Configured browser origins are normalized and matched by exact `Set` membership. CORS permits `Authorization` but not credentialed requests, and the frontend always combines protected paths with one validated API origin and `credentials: "omit"`. The documented `sessionStorage` choice retains the acknowledged same-origin-XSS tradeoff.

**Confirmed, MEDIUM:** `backend/src/routes/auth.ts:38-46` keys its identity limit as `login:identity:${request.ip}:${usernameHash}`. Changing IP resets both focused controls, leaving the single administrator identity open to distributed guessing and Argon2 resource pressure. Add a separate username-hash/account control with deployment-appropriate shared state, retain the IP control, avoid permanent attacker-triggered lockout, and test one username across changing IPs.

## Public CMS serialization crosses draft and hidden boundaries

**Confirmed, MEDIUM:** `backend/src/routes/content.ts:13` exposes `getPublishedContent` without authentication, and `backend/src/content/repository.ts:29-40` serializes all of `site_content.content`. The row-level `published` flag does not enforce nested campaign/news/report status or document `isPublic`; those filters run only in React. Hidden document and draft report URLs become discoverable, and embargoed copy reaches any API caller.

Return a visibility-projected document from the public route and add a bearer-protected full-document read for editors. Tests should seed inactive, draft, and hidden records and prove they are absent publicly but available to an authenticated administrator.

## Upload and SQL boundaries are enforced below the browser

Multipart parsing and the asset repository each enforce 10 MB, and PostgreSQL constrains MIME, byte count, and stored length. JPEG, PNG, WebP, GIF, and PDF declarations require matching signatures. Restricted ASCII filenames make the inline disposition header non-injectable, while `nosniff` and digest ETags accompany immutable responses.

Authentication, content, asset, donation, audit, bootstrap, and importer values all use tagged Postgres.js parameters. The two `transaction.unsafe` calls execute constant migration-table DDL and SQL loaded from version-controlled migrations after bundled content validation; request and imported-row values are not concatenated into executable SQL.

## Donor reports need cache and spreadsheet defenses

**Confirmed, MEDIUM:** `backend/src/routes/donations.ts:19-32` returns names, emails, phones, provider IDs, and receipt data without `Cache-Control: no-store`. Add `no-store` and assert the header so browser/private caches are instructed not to retain donor PII after logout or revocation.

**Confirmed, MEDIUM:** `src/payments/contracts.ts:53-56` quotes CSV cells but leaves leading `=`, `+`, `-`, and `@` intact. Imported donor-controlled names, purposes, emails, provider IDs, or receipts can execute as formulas when opened in a spreadsheet. Neutralize formula prefixes, including after leading whitespace/control characters, before CSV quoting and add focused cases.

## Migration history comparison is incomplete and PostgreSQL behavior is unverified

The seed uses conflict-safe inserts for both the singleton content row and initial revision, and rendered default JSON participates in its checksum. Advisory locking and one transaction protect migration application.

**Confirmed, MEDIUM:** `backend/src/migrate.ts:60-72` maps all applied versions but iterates only current source files. A deleted applied file is never rejected, while `/health` can still report current from `max(version) = '002'`. Compare both sets using version, name, and checksum, fail on applied entries absent from source, test deletion/rename, and derive readiness from the complete expected history.

**Confirmed, MEDIUM:** `verification.md:60` says migrations were not run against a disposable PostgreSQL database. Fake-query tests do not parse or execute the DDL, constraints, triggers, views, JSON cast, or Postgres.js multi-statement behavior. Before release, apply twice on a Railway-matching PostgreSQL instance, assert one `main` row/revision, and exercise changed-history rejection.

## Fastify remains on a production-audited vulnerable version

**Confirmed, HIGH:** `backend/package.json:22` pins `fastify@5.6.2`, while `verification.md:63` records a high-severity production advisory group and names `5.12.5` as fixed. Public health, content, asset, and login traffic directly reaches this framework. Amend the version decision, upgrade Fastify plus compatible plugins/lockfile entries, rerun the focused security checks, or document advisory-specific non-applicability through an explicit security acceptance before deployment.

## Hidden contact entry keeps fallback behavior but lacks interactive evidence

Name and Email are sent only to backend login as username/password. Success resets the form, stores the shared opaque session, and navigates to `/admin`, where a newly mounted provider verifies it before dashboard rendering. Failure is swallowed before `checkValidity()`/`reportValidity()` and encoded `mailto:` preparation, so no admin-specific state appears. The public layout has no Admin link; direct `/admin` remains available.

**Confirmed, LOW:** `verification.md:61` says no browser smoke test was possible. Exercise hidden success, invalid credentials, API timeout, ordinary valid enquiry, direct `/admin` refresh, logout, and expiry in staging with real Railway credentials.

The supplied evidence covers backend install/build, 18 focused tests, Vite build, formatting, and static secret/Supabase searches; this review did not rerun them. All eight expected `public/documents/` files remain present and their Vercel-relative URLs remain in backend defaults. With no Git baseline, independent byte comparison is unavailable, but verification records no writes to that directory and no migration/import path targets it.

</details>

<details>
<summary>File map</summary>

- `backend/src/app.ts`, `config.ts`, `server.ts`, `db.ts`, `errors.ts`, `audit.ts`, and `contracts.ts` — API composition, exact-origin configuration, lifecycle, and error contracts.
- `backend/src/auth/**` and `backend/src/routes/auth.ts` — Argon2id bootstrap, bearer sessions, authorization, throttling, verification, and logout.
- `backend/src/routes/content.ts` and `backend/src/content/**` — schema-v2 CMS reads, revisioned writes, and defaults.
- `backend/src/routes/assets.ts` and `backend/src/assets/repository.ts` — authenticated upload and immutable asset serving.
- `backend/src/routes/donations.ts` and `backend/src/donations/repository.ts` — protected paid-donation reports.
- `backend/src/migrate.ts`, `backend/migrations/**`, and `backend/src/scripts/import-legacy.ts` — migration history, singleton seed, and offline import.
- `backend/src/tests/**` — focused auth, CORS, content, upload, donation, and migration orchestration checks.
- `src/lib/api.ts`, `src/auth/**`, `src/cms/**`, and `src/payments/**` — Railway client, session lifecycle, CMS operations, upload, and reporting.
- `src/admin/**`, `src/pages/HomePage.tsx`, `src/components/PublicLayout.tsx`, `src/App.tsx`, and `src/lib/router.tsx` — dashboard gate, contact shortcut, public navigation, and SPA routing.
- `.env.example`, `RAILWAY_DEPLOYMENT.md`, and `backend/README.md` — Vercel/Railway variables and operations.
- `public/documents/*` — eight preserved static governance files.

No Git diff exists in this workspace; the review used the plan, verification note, and current specified implementation surface.

</details>
