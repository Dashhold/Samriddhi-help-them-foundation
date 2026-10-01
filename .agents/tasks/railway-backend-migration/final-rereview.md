# Public redaction, same-origin API routing, and keyboard-modal certificate preview

The current staged code closes all three prior medium-severity blockers. The public CMS response now removes paused transfer destinations and parent-disabled announcement/fundraising values while the authenticated editor receives the untouched document. Production requests are forced through relative paths, and the certificate preview uses native modal behavior with initial focus, required close paths, focus restoration, and retained printing. Railway packaging, governance documents, and the prior security repairs remain intact, with no staged `.env` or requested administrator values.

**Watch for:** **confirmed** — no HIGH or MEDIUM concern remains in scope. The retained validation covers build, tests, types, formatting, and audits; the deployment checklist retains final browser confirmation of native dialog behavior.

**Verdict**: APPROVED

## High-level view

Public and administrator content paths now deliberately diverge. `GET /api/content` receives a schema-valid projection with disabled parent data removed, while bearer-protected `GET /api/admin/content` returns the complete stored snapshot.

Production API routing is enforced in code: the base resolves to an empty string, all frontend network calls use the shared request helper, and `VITE_API_URL` reaches that helper only during Vite development.

The certificate preview is a `<dialog>` opened with `showModal()`, so the browser’s modal top layer makes background content inert and contains sequential focus. Component code adds deterministic initial focus, Escape/backdrop closure, opener restoration, and the existing print-only layout.

The root workspace still builds both packages, Railway migrates before starting Fastify and gates on `/health`, and the eight legal assets remain content-identical moves. Current source retains the fixed Fastify release, account-wide throttle, protected-response cache controls, CSV sanitization, complete migration-history checks, and log redaction.

<details>
<summary>Issues (0)</summary>

No actionable findings in the requested scope.

</details>

<details>
<summary>Details</summary>

## Parent publication switches define the public CMS boundary

`backend/src/content/repository.ts:29-95` now constructs the public document field by field. Disabled announcements lose copy and links, disabled fundraising loses descriptive fields and all nested campaigns, and paused donations lose the QR URL, UPI ID, payee, every bank-account destination, and gateway availability. General instructions and the receipt email remain because `frontend/src/pages/DonatePage.tsx` intentionally uses them outside the transfer-availability branch; neither is a fund-transfer destination. The authenticated route instead calls `getAdminContent` behind `requireAdmin` and `Cache-Control: no-store` (`backend/src/routes/content.ts:16-18`), preserving the full editor state.

The regression at `backend/src/tests/api.test.ts:361-491` installs unique private sentinels for announcement, fundraising, QR, UPI, payee, and bank values. It checks the projected structures, proves every sentinel is absent from raw `publicResponse.body`, then proves the complete stored document and every sentinel remain in raw authenticated `adminResponse.body`.

## Production cannot consume the development API override

`frontend/src/lib/api.ts:3-10` supplies `VITE_API_URL` only under `import.meta.env.DEV`. `frontend/src/lib/api-origin.ts:7-28` returns the empty production base before considering configured input, so endpoints remain relative; only development accepts a validated HTTP(S) origin.

The only direct frontend `fetch` is inside this shared helper; authentication, CMS, upload, and donor-report clients all call `apiRequest`. `backend/src/tests/core.test.ts:92-119` executes the resolver with a foreign production value and asserts an empty base and relative login path, then verifies the local-development override. `.env.example` and `RAILWAY_DEPLOYMENT.md` match that contract.

## Native top-layer modality closes the focus escape

`frontend/src/components/CertificatePreviewModal.tsx:18-48` captures the opener, invokes `showModal()`, focuses Close, routes Escape through controlled closure, and closes on the full-screen surface outside the panel. Native modal-dialog behavior makes background controls inert and confines forward/reverse sequential focus; cleanup closes the dialog and restores focus to the connected opener.

Printing remains wired through `window.print()`. `frontend/src/index.css:516-527` hides the surrounding interface and exposes only `.certificate-print-root` on an A4 landscape page. No browser suite was rerun for this review, as requested; the inspected validation transcript reports 22 passing source tests, and the Railway smoke checklist retains Tab, Shift+Tab, Escape, backdrop, return-focus, and print confirmation.

## Railway, legal assets, credentials, and prior fixes remain preserved

`package.json` retains the `frontend`/`backend` workspaces and combined build. `railway.json` still builds, migrates, starts, and health-checks the service; `backend/src/server.ts` enables frontend serving, while `backend/src/app.ts` serves the constant `frontend/dist` root without letting SPA fallback shadow `/api/*`.

Staged name-status records all eight governance files as 100% renames into `frontend/public/documents`, and active frontend/backend configuration has no Supabase or Vercel client reference. Index inspection finds no staged `.env`; `.gitignore` excludes it, `.env.example` is placeholder-only, and staged-content searches find neither requested administrator value. Runtime credentials remain server-only and are stored as Argon2id hashes.

The prior repairs remain visible in current source: Fastify `5.12.5`; independent IP and PostgreSQL username-hash login limits; `no-store` on protected auth, content, and donor responses; formula-prefix neutralization after leading controls/whitespace; complete version/name/checksum migration checks in execution and readiness; and production log redaction. The retained post-fix transcript reports successful build, 22/22 tests, strict checks, formatting, and zero-vulnerability production/full audits; it was inspected rather than rerun.

</details>

<details>
<summary>File map</summary>

- `backend/src/content/repository.ts`, `routes/content.ts`, `tests/api.test.ts` — public redaction, protected full content, and raw-response coverage.
- `frontend/src/lib/api-origin.ts`, `lib/api.ts`, `backend/src/tests/core.test.ts` — production-relative routing and its executable assertion.
- `frontend/src/components/CertificatePreviewModal.tsx`, `pages/HomePage.tsx`, `index.css` — native modal lifecycle, opener, and print behavior.
- `package.json`, `railway.json`, `backend/src/app.ts`, `backend/src/server.ts` — monorepo deployment and single-process static/API serving.
- `frontend/public/documents/**` — eight preserved governance documents.
- `backend/src/routes/auth.ts`, `routes/donations.ts`, `migrate.ts`, `routes/health.ts`, `frontend/src/payments/contracts.ts`, `backend/package.json` — retained security repairs.
- `.env.example`, `.gitignore`, `RAILWAY_DEPLOYMENT.md` — placeholder configuration, secret exclusion, and deployment contract.

Full staged diff: `git diff --cached`.

</details>
