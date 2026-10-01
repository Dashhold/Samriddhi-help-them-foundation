# Samriddhi content layer

`CmsProvider` exposes one typed content model to public and admin components. Its transport is now Supabase rather than browser storage.

## Runtime behavior

- Public pages render bundled defaults immediately, then hydrate from the published `site_content` row.
- If Supabase configuration or the network is unavailable, public pages retain the safe bundled fallback.
- The admin gate does not open editors unless Auth, `admin_users` authorization and remote content loading all succeed.
- Admin writes use optimistic revision matching, preventing one session from silently overwriting a newer revision.
- PostgreSQL Realtime propagates published updates to already-open public pages.
- Every write creates a row in `site_content_revisions` through a database trigger.

## Content and financial data separation

Editable public copy, news, fundraising appeals, donation display settings and public report metadata live in the CMS JSON document. Verified donation transactions remain in the separate protected `donations` ledger and can only be written by a future trusted payment webhook/Edge Function.

## Assets

Admin image/PDF controls upload directly to the `cms-media` bucket through `storage.ts`. The bucket is public-read because the files appear on the public site, but PostgreSQL Storage policies allow writes only for active administrators.

See `supabase/README.md` for migration, environment and first-admin setup.
