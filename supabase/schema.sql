-- Investory Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- Uses the anon/public key only from the Angular app; RLS enforces ownership.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Investment components (dynamic investment types: PPF, SIP, Gold, NPS, ...)
create table if not exists public.investment_components (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null default '',
  default_monthly_amount numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists investment_components_user_id_idx
  on public.investment_components (user_id);

alter table public.investment_components enable row level security;

create policy "Users manage own investment components"
  on public.investment_components for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Monthly investment records (entries stored as JSONB matching the app model)
create table if not exists public.monthly_investments (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  investments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, month)
);

create index if not exists monthly_investments_user_id_idx
  on public.monthly_investments (user_id);

alter table public.monthly_investments enable row level security;

create policy "Users manage own monthly investments"
  on public.monthly_investments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sync metadata (overall updated_at for conflict resolution)
create table if not exists public.user_sync_meta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  data_version int not null default 1
);

alter table public.user_sync_meta enable row level security;

create policy "Users manage own sync meta"
  on public.user_sync_meta for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
