-- Persistencia de campañas generadas en Estudio.
-- Correr en Supabase -> SQL Editor. Una sola vez.

create table if not exists public.studio_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  name               text not null,
  prompt             text not null,
  content            jsonb not null,
  content_by_channel jsonb not null default '{}'::jsonb,
  created_at         timestamptz default now()
);

alter table public.studio_campaigns enable row level security;

drop policy if exists studio_campaigns_owner on public.studio_campaigns;
create policy studio_campaigns_owner on public.studio_campaigns
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists studio_campaigns_user_created_idx
  on public.studio_campaigns (user_id, created_at desc);
