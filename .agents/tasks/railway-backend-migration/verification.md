# Railway monorepo and final review verification

## Outcome

The React/Vite frontend and Fastify/PostgreSQL backend remain organized as one npm workspace and one Railway web service. Fastify serves `frontend/dist`, API routes retain precedence, and production frontend API calls are forced to same-origin relative paths.

All three confirmed final-review findings are repaired:

1. The public CMS DTO now redacts disabled announcement content, every campaign and section-copy value under disabled fundraising, and paused donation transfer destinations/configuration. The authenticated administrator endpoint still returns the complete stored document.
2. `VITE_API_URL` is evaluated only for Vite development. Production resolves every API request to a relative same-origin path even when a foreign build variable is supplied.
3. The certificate preview uses native `HTMLDialogElement.showModal()`, which supplies browser focus containment and background inertness. Initial focus, Escape, backdrop closure, opener-focus restoration, body scroll restoration, and print-only certificate behavior are preserved.

The Railway configuration, PostgreSQL migration history, removed legacy hosting integrations, and all eight governance files remain intact. `final-review.json` and `final-review.md` were not modified.

## Final review changes

### Public CMS projection

- `backend/src/content/repository.ts` now constructs an explicit public document rather than passing the full document through with only collection filters.
- Disabled announcement label/message/link values are replaced with schema-compatible blank/default values.
- Disabled fundraising copy and all nested campaigns are removed, including campaigns whose own status is active.
- Paused donations blank QR, UPI, payee, bank, account, IFSC, branch, and account-type values; payment minimum/gateway configuration receives safe defaults. Public instructions and the acknowledgement contact remain available because the paused public page still uses them.
- Existing disabled focus-area, inactive campaign, draft news/report, and private-document filtering remains in place.
- `backend/src/tests/api.test.ts` asserts against raw response bodies: every marked private value is absent from unauthenticated `/api/content`, remains present in authenticated `/api/admin/content`, and the redacted public DTO still passes the complete site-content schema.
- `frontend/src/pages/DonatePage.tsx` also respects disabled fundraising when constructing campaign choices and does not render an empty payee warning while donations are paused.

### Production API origin

- `frontend/src/lib/api-origin.ts` contains the environment-aware URL resolver.
- `frontend/src/lib/api.ts` passes `VITE_API_URL` only from the development branch. Production always receives an empty base URL and therefore generates `/api/...` request paths.
- `backend/src/tests/core.test.ts` supplies a foreign production `VITE_API_URL`, asserts the resolved base is empty, and asserts the login endpoint remains `/api/auth/login`; it also confirms the documented localhost override still works in development.
- `.env.example`, `README.md`, `backend/README.md`, and `RAILWAY_DEPLOYMENT.md` continue to describe the override as local-Vite-development-only. The deployment guide now explicitly states that production ignores it.

### Keyboard-modal certificate preview

- `frontend/src/components/CertificatePreviewModal.tsx` now renders a native `<dialog>` and opens it with `showModal()` after mount.
- The close button receives initial focus. Native modality contains forward/reverse keyboard focus and makes the document behind the dialog inert.
- The controlled `cancel` handler preserves Escape closure; backdrop pointer closure and focus return to the opener remain explicit.
- `frontend/src/index.css` preserves the existing full-viewport design and print layout for the native top-layer dialog.
- No DOM/browser test framework exists in the repository, so `RAILWAY_DEPLOYMENT.md` now requires staging checks for forward Tab, reverse Shift+Tab, Escape, backdrop close, opener-focus return, and Print/Save-as-PDF.

## Changed files for these fixes

- `backend/src/content/repository.ts`
- `backend/src/tests/api.test.ts`
- `backend/src/tests/core.test.ts`
- `frontend/src/lib/api-origin.ts` (new)
- `frontend/src/lib/api.ts`
- `frontend/src/components/CertificatePreviewModal.tsx`
- `frontend/src/pages/DonatePage.tsx`
- `frontend/src/index.css`
- `RAILWAY_DEPLOYMENT.md`
- `.agents/tasks/railway-backend-migration/verification.md`
- `.agents/tasks/railway-backend-migration/current-validation.log`

## Exact validation results

The required sequence was run from the repository root on 10 February 2026 through Windows `.cmd` shims because PowerShell script execution is restricted. Complete output and per-command exit markers are retained in `current-validation.log`.

- `npm run format` — **PASS** (`FORMAT_EXIT=0`); pinned oxfmt processed 40 frontend targets.
- `npm run build` — **PASS** (`BUILD_EXIT=0`); Vite `8.3.2` transformed 55 modules and emitted `frontend/dist`, then backend TypeScript compiled successfully.
- `npm test` — **PASS** (`TEST_EXIT=0`); 22 tests passed, 0 failed/cancelled/skipped. New cases cover parent-switch raw serialization and production API-origin enforcement.
- `npm run check` — **PASS** (`CHECK_EXIT=0`); frontend strict TypeScript and backend no-emit TypeScript checks both passed.
- `npm run format:check` — **PASS** (`FORMAT_CHECK_EXIT=0`); all 40 formatter targets matched.
- `npm audit --omit=dev` — **PASS** (`PRODUCTION_AUDIT_EXIT=0`), 0 vulnerabilities.
- `npm audit` — **PASS** (`FULL_AUDIT_EXIT=0`), 0 vulnerabilities.
- Governance-file SHA-256/length comparison against `move-evidence.json` — **PASS**, 8/8 exact matches.
- Active source/configuration/documentation scan (excluding historical task evidence, dependencies, and build output) — **PASS**, no removed-platform references.

Local validation used Node `24.21.0` and npm `11.19.0`; the repository and Railway remain pinned to Node 22, and backend compilation uses Node 22 type definitions.

## Environment-only checks

### Disposable PostgreSQL

A live apply-twice migration check remains unavailable in this workspace: Docker's Linux daemon is not running, `psql` is unavailable, no PostgreSQL Windows service exists, and no staging `DATABASE_URL` was supplied. This is an environment limitation, not a source failure. Run `npm run migrate` twice against a disposable Railway PostgreSQL service and repeat the changed/renamed/deleted-history checks documented in this task before production rollout.

### Browser/Railway smoke

No browser automation tool or deployed Railway URL is available, so native-dialog keyboard traversal and the print dialog were not claimed as live-smoked. The production build and source/model checks pass. In staging, execute the expanded `RAILWAY_DEPLOYMENT.md` checklist, especially forward Tab, reverse Shift+Tab, Escape, backdrop closure, opener-focus restoration, and certificate-only printing.
