-- Business DNA, catalogue and private brand assets.
-- Keeps the legacy brand_brain columns used by the campaign pipeline.

create extension if not exists pgcrypto;

alter table public.brand_brain
  add column if not exists website_url text,
  add column if not exists business_name text,
  add column if not exists identity jsonb not null default '{}'::jsonb,
  add column if not exists positioning jsonb not null default '{}'::jsonb,
  add column if not exists audience_profile jsonb not null default '{}'::jsonb,
  add column if not exists communication jsonb not null default '{}'::jsonb,
  add column if not exists visual_identity jsonb not null default '{}'::jsonb,
  add column if not exists operations jsonb not null default '{}'::jsonb,
  add column if not exists social_proof jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists onboarding_path text,
  add column if not exists onboarding_state jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists completion_percentage integer not null default 0;

alter table public.brand_brain
  drop constraint if exists brand_brain_onboarding_path_check;
alter table public.brand_brain
  add constraint brand_brain_onboarding_path_check
  check (onboarding_path is null or onboarding_path in ('url', 'manual'));

alter table public.brand_brain
  drop constraint if exists brand_brain_completion_percentage_check;
alter table public.brand_brain
  add constraint brand_brain_completion_percentage_check
  check (completion_percentage between 0 and 100);

-- Existing users must not be locked out by the new onboarding gate.
update public.brand_brain
set onboarding_completed_at = coalesce(onboarding_completed_at, updated_at, now()),
    completion_percentage = 100
where onboarding_completed_at is null
  and coalesce(nullif(trim(industria), ''), nullif(trim(propuesta), ''),
               nullif(trim(tono), ''), nullif(trim(audiencia), '')) is not null;

update public.brand_brain as brain
set business_name = coalesce(
  nullif(brain.business_name, ''),
  nullif(brain.identity->>'name', ''),
  nullif(users.raw_user_meta_data->>'company_name', '')
)
from auth.users as users
where brain.user_id = users.id
  and coalesce(brain.business_name, '') = '';

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('product', 'service')),
  name text not null,
  category text,
  description text,
  price numeric(12, 2),
  currency text not null default 'BOB',
  cta text,
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_items_user_status_idx
  on public.catalog_items(user_id, status, updated_at desc);

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  asset_type text not null default 'reference'
    check (asset_type in ('logo', 'product', 'photo', 'background', 'reference', 'previous_piece')),
  title text not null,
  description text,
  tags text[] not null default '{}',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  source_url text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create index if not exists brand_assets_user_status_idx
  on public.brand_assets(user_id, status, created_at desc);

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Principal',
  address text,
  city text,
  country text,
  phone text,
  whatsapp text,
  email text,
  opening_hours jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  network text not null,
  url text not null,
  handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, network, url)
);

create table if not exists public.brand_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  field_path text not null,
  detected_value jsonb not null,
  source_url text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  confirmed_by_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_sources_user_field_idx
  on public.brand_sources(user_id, field_path);

create table if not exists public.brand_extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  current_stage integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  stage_label text not null default 'Preparando el analisis',
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists brand_extraction_jobs_user_created_idx
  on public.brand_extraction_jobs(user_id, created_at desc);

alter table public.catalog_items enable row level security;
alter table public.brand_assets enable row level security;
alter table public.business_locations enable row level security;
alter table public.social_links enable row level security;
alter table public.brand_sources enable row level security;
alter table public.brand_extraction_jobs enable row level security;

drop policy if exists catalog_items_owner on public.catalog_items;
create policy catalog_items_owner on public.catalog_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists brand_assets_owner on public.brand_assets;
create policy brand_assets_owner on public.brand_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists business_locations_owner on public.business_locations;
create policy business_locations_owner on public.business_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists social_links_owner on public.social_links;
create policy social_links_owner on public.social_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists brand_sources_owner on public.brand_sources;
create policy brand_sources_owner on public.brand_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists brand_extraction_jobs_owner on public.brand_extraction_jobs;
create policy brand_extraction_jobs_owner on public.brand_extraction_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists brand_assets_storage_select on storage.objects;
create policy brand_assets_storage_select on storage.objects
  for select using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists brand_assets_storage_insert on storage.objects;
create policy brand_assets_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists brand_assets_storage_update on storage.objects;
create policy brand_assets_storage_update on storage.objects
  for update using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists brand_assets_storage_delete on storage.objects;
create policy brand_assets_storage_delete on storage.objects
  for delete using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
