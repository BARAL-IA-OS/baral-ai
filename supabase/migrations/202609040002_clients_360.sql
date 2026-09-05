-- Clients 360 extensions, saved segments and reviewable CSV imports.

alter table public.clients
  add column if not exists company text,
  add column if not exists interest text,
  add column if not exists source text,
  add column if not exists lifecycle_status text not null default 'new',
  add column if not exists last_purchase_amount numeric(12, 2),
  add column if not exists tags text[] not null default '{}',
  add column if not exists notes text,
  add column if not exists contact_consent boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.clients alter column email drop not null;

alter table public.clients
  drop constraint if exists clients_lifecycle_status_check;
alter table public.clients
  add constraint clients_lifecycle_status_check
  check (lifecycle_status in ('new', 'active', 'inactive', 'vip', 'do_not_contact'));

create index if not exists clients_user_status_idx
  on public.clients(user_id, lifecycle_status);
create index if not exists clients_user_email_lower_idx
  on public.clients(user_id, lower(email));
create index if not exists clients_user_phone_idx
  on public.clients(user_id, telefono);

create table if not exists public.client_segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  headers jsonb not null default '[]'::jsonb,
  suggested_mapping jsonb not null default '{}'::jsonb,
  mapping jsonb not null default '{}'::jsonb,
  raw_rows jsonb not null default '[]'::jsonb,
  preview_rows jsonb not null default '[]'::jsonb,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'mapped', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_segments_user_idx
  on public.client_segments(user_id, updated_at desc);
create index if not exists client_imports_user_idx
  on public.client_imports(user_id, created_at desc);

alter table public.client_segments enable row level security;
alter table public.client_imports enable row level security;

drop policy if exists client_segments_owner on public.client_segments;
create policy client_segments_owner on public.client_segments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists client_imports_owner on public.client_imports;
create policy client_imports_owner on public.client_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
