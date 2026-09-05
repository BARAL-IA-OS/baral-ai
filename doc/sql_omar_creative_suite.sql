-- Suite creativa de OMAR: Campanas, recursos, Brand Book y Auditoria.
-- Ejecutar una vez en Supabase SQL Editor. Todas las tablas usan RLS.

create extension if not exists pgcrypto;

create table if not exists public.creative_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  prompt text not null,
  brief jsonb not null default '{}'::jsonb,
  status text not null default 'BRIEF' check (status in ('BRIEF','PROCESSING','READY','FAILED')),
  content_by_channel jsonb not null default '{}'::jsonb,
  versions jsonb not null default '[]'::jsonb,
  aspect_ratio text not null default '1:1',
  channels jsonb not null default '[]'::jsonb,
  selected_assets jsonb not null default '[]'::jsonb,
  idempotency_key text,
  last_generation_key text,
  tokens_used integer not null default 0,
  cost_usd numeric(12,6) not null default 0,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists creative_campaigns_user_idempotency_idx
  on public.creative_campaigns(user_id, idempotency_key) where idempotency_key is not null;
create index if not exists creative_campaigns_user_created_idx
  on public.creative_campaigns(user_id, created_at desc);

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.creative_campaigns(id) on delete set null,
  kind text not null,
  name text,
  storage_path text,
  url text,
  image_b64 text,
  prompt text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'GENERATED' check (status in ('GENERATED','SAVED','FAILED')),
  provider text,
  tokens_used integer not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists generated_assets_user_created_idx
  on public.generated_assets(user_id, created_at desc);

create table if not exists public.brand_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cover_url text,
  selected_assets jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  status text not null default 'SAVED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brand_books_user_created_idx
  on public.brand_books(user_id, created_at desc);

create table if not exists public.website_audit_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  domain text not null,
  consent_version text not null,
  authorized_at timestamptz not null default now()
);

create table if not exists public.website_audit_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_id uuid not null references public.website_audit_consents(id) on delete restrict,
  url text not null,
  domain text not null,
  status text not null default 'PROCESSING' check (status in ('PROCESSING','COMPLETED','FAILED')),
  progress integer not null default 0 check (progress between 0 and 100),
  idempotency_key text,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists website_audit_runs_user_idempotency_idx
  on public.website_audit_runs(user_id, idempotency_key) where idempotency_key is not null;
create index if not exists website_audit_runs_user_created_idx
  on public.website_audit_runs(user_id, created_at desc);

alter table public.creative_campaigns enable row level security;
alter table public.generated_assets enable row level security;
alter table public.brand_books enable row level security;
alter table public.website_audit_consents enable row level security;
alter table public.website_audit_runs enable row level security;

drop policy if exists "creative_campaigns_owner" on public.creative_campaigns;
create policy "creative_campaigns_owner" on public.creative_campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "generated_assets_owner" on public.generated_assets;
create policy "generated_assets_owner" on public.generated_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "brand_books_owner" on public.brand_books;
create policy "brand_books_owner" on public.brand_books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "website_audit_consents_owner" on public.website_audit_consents;
create policy "website_audit_consents_owner" on public.website_audit_consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "website_audit_runs_owner" on public.website_audit_runs;
create policy "website_audit_runs_owner" on public.website_audit_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El bucket debe ser privado. El backend genera URLs firmadas de corta duracion.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', false)
on conflict (id) do update set public = false;
