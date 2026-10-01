begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.site_content (
  id text primary key default 'main' check (id = 'main'),
  schema_version integer not null default 2 check (schema_version = 2),
  content jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.site_content_revisions (
  id bigint generated always as identity primary key,
  site_id text not null,
  revision bigint not null,
  content jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  unique (site_id, revision)
);

alter table public.site_content enable row level security;
alter table public.site_content_revisions enable row level security;

create or replace function public.record_site_content_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.revision := old.revision + 1;
  end if;
  new.updated_at := now();
  new.updated_by := (select auth.uid());

  insert into public.site_content_revisions (site_id, revision, content, changed_at, changed_by)
  values (new.id, new.revision, new.content, new.updated_at, new.updated_by)
  on conflict (site_id, revision) do nothing;

  return new;
end;
$$;

drop trigger if exists site_content_revision_trigger on public.site_content;
create trigger site_content_revision_trigger
before insert or update on public.site_content
for each row execute function public.record_site_content_revision();

insert into public.site_content (id, schema_version, content, published)
values ('main', 2, '{}'::jsonb, true)
on conflict (id) do nothing;

-- Public visitors can read only the published content row.
drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content"
on public.site_content for select
to anon, authenticated
using (published = true);

-- Only active administrators can create or modify content.
drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
on public.site_content for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
on public.site_content for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
on public.site_content for delete
to authenticated
using (public.is_admin());

-- An authenticated user can inspect only their own admin membership.
drop policy if exists "Users can read own admin membership" on public.admin_users;
create policy "Users can read own admin membership"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can read content revisions" on public.site_content_revisions;
create policy "Admins can read content revisions"
on public.site_content_revisions for select
to authenticated
using (public.is_admin());

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant select on public.admin_users to authenticated;
grant select on public.site_content_revisions to authenticated;

-- Public CMS media. File writes remain restricted to active administrators.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read CMS media" on storage.objects;
create policy "Public can read CMS media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'cms-media');

drop policy if exists "Admins can upload CMS media" on storage.objects;
create policy "Admins can upload CMS media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "Admins can update CMS media" on storage.objects;
create policy "Admins can update CMS media"
on storage.objects for update
to authenticated
using (bucket_id = 'cms-media' and public.is_admin())
with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "Admins can delete CMS media" on storage.objects;
create policy "Admins can delete CMS media"
on storage.objects for delete
to authenticated
using (bucket_id = 'cms-media' and public.is_admin());

-- Payment-ready immutable ledger. Browser clients cannot insert or mutate it;
-- a future verified webhook/Edge Function writes through the service role.
do $$ begin
  create type public.donation_status as enum ('created', 'pending', 'paid', 'failed', 'refunded');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_order_id text not null unique,
  provider_payment_id text unique,
  donor_type text not null check (donor_type in ('individual', 'company')),
  donor_name text not null,
  company_name text,
  email text not null,
  phone text,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  campaign_id text,
  purpose text not null default 'General donation',
  status public.donation_status not null default 'created',
  receipt_number text unique,
  receipt_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_id)
);

alter table public.donations enable row level security;
alter table public.payment_webhook_events enable row level security;

drop policy if exists "Admins can read donations" on public.donations;
create policy "Admins can read donations"
on public.donations for select
to authenticated
using (public.is_admin());

grant select on public.donations to authenticated;

-- No client policies are intentionally created for webhook events.

create or replace view public.monthly_donation_reports
with (security_invoker = true)
as
select
  date_trunc('month', paid_at) as period_start,
  count(*) as donation_count,
  sum(amount_minor) as total_amount_minor,
  currency
from public.donations
where status = 'paid' and paid_at is not null
group by date_trunc('month', paid_at), currency;

create or replace view public.yearly_donation_reports
with (security_invoker = true)
as
select
  date_trunc('year', paid_at) as period_start,
  count(*) as donation_count,
  sum(amount_minor) as total_amount_minor,
  currency
from public.donations
where status = 'paid' and paid_at is not null
group by date_trunc('year', paid_at), currency;

grant select on public.monthly_donation_reports to authenticated;
grant select on public.yearly_donation_reports to authenticated;

-- Keep public pages already open in sync after an administrator publishes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_content'
  ) then
    alter publication supabase_realtime add table public.site_content;
  end if;
end $$;

commit;
