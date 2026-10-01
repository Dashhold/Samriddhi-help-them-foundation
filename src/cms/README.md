# Samriddhi content layer

The public website reads all editable content through `CmsProvider`.

## Current adapter

`CmsProvider.tsx` persists a versioned snapshot in `localStorage`. This is intentionally a **single-browser preview adapter** so the dashboard and public pages can be built and reviewed before backend credentials are available. It is not authentication and it does not publish one administrator's edits to other visitors.

## Production adapter contract

Replace the persistence internals without changing page components:

- `GET /api/content` — published public snapshot
- `GET /api/admin/content` — authenticated draft snapshot
- `PUT /api/admin/content` — validate and save a draft
- `POST /api/admin/content/publish` — atomically publish a version
- `POST /api/admin/assets` — authenticated image/document upload to object storage
- `POST /api/admin/login` and secure server-side sessions

Maintain `CmsSnapshot.schemaVersion`, validate every server payload, log content revisions, and keep payment records outside this editable content document.
