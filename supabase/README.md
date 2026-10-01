# Supabase backend setup

This repository deploys as a static Figma/Vite site, so Supabase supplies the hosted PostgreSQL database, administrator authentication and media storage.

## 1. Create and migrate the project

1. Create a Supabase project owned by the foundation.
2. Open **SQL Editor** and run `migrations/202609290001_initial_backend.sql`, or link the Supabase CLI and run `supabase db push`.
3. Confirm that the `cms-media` Storage bucket exists and is public-read/admin-write.

## 2. Configure the website

Copy `.env.example` to `.env.local` for local development. Set the equivalent build variables in the Figma/deployment environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (the public publishable/anon key, never the service-role key)

Restart/redeploy after changing build variables.

## 3. Create the first administrator

Create the administrator under **Authentication → Users** in the Supabase dashboard using their real email and a strong temporary password. Then promote that exact Auth user from SQL Editor:

```sql
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do update
set email = excluded.email, active = true;
```

The user can then sign in at `/admin`. Authentication alone is not enough: the `admin_users` row and RLS policies independently authorize every content and Storage write.

## 4. Production settings

- Add the deployed site URLs under **Authentication → URL Configuration**.
- Disable open public sign-up unless the foundation needs it. Admins are created manually.
- Enable MFA for administrators when available in the chosen plan.
- Keep the service-role key only in future Edge Functions/payment webhook secrets.
- Back up PostgreSQL and periodically review `site_content_revisions` and admin membership.

## Payment preparation

`donations` and `payment_webhook_events` are intentionally not writable by browser clients. A future payment Edge Function uses the service role after verifying the provider signature. Monthly and yearly views inherit the `donations` RLS policy, so only active administrators can query them.
