-- Registro de gasto de generacion (texto + imagen) por usuario.
-- Correr en Supabase → SQL Editor. Una sola vez.

create table if not exists public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) not null,
  kind       text not null,                 -- 'text' | 'image'
  provider   text,                          -- ej. 'openai:gpt-image-1', 'deepseek:deepseek-chat'
  tokens     integer default 0,
  cost_usd   numeric(10,6) default 0,
  meta       jsonb,
  created_at timestamptz default now()
);

-- RLS: cada usuario ve solo sus eventos (el backend usa service_key y filtra por user_id).
alter table public.usage_events enable row level security;

drop policy if exists usage_events_owner on public.usage_events;
create policy usage_events_owner on public.usage_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists usage_events_user_idx on public.usage_events (user_id);
