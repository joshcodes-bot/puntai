-- ============================================================
-- PUNT.AI — Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  avatar_initials  text,
  balance          numeric(10, 2) default 0.00,
  tier             text default 'Bronze' check (tier in ('Bronze', 'Silver', 'Gold', 'Platinum')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 2. PUNTS TABLE
create table if not exists public.punts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event        text not null,
  pick         text not null,
  odds         numeric(6, 2) not null,
  stake        numeric(10, 2) not null,
  result       text default 'pending' check (result in ('pending', 'won', 'lost', 'void')),
  payout       numeric(10, 2) default 0.00,
  event_date   date not null,
  created_at   timestamptz default now()
);

-- 3. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_initials)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_initials'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. UPDATE updated_at AUTOMATICALLY
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 5. LEADERBOARD VIEW
create or replace view public.leaderboard_view as
select
  p.id as user_id,
  p.full_name,
  p.avatar_initials,
  p.tier,
  count(b.id)                                                   as total_punts,
  count(b.id) filter (where b.result = 'won')                   as wins,
  round(
    count(b.id) filter (where b.result = 'won')::numeric /
    nullif(count(b.id) filter (where b.result in ('won','lost')), 0) * 100
  , 0)                                                           as win_rate,
  coalesce(sum(b.payout) filter (where b.result = 'won'), 0) -
  coalesce(sum(b.stake)  filter (where b.result in ('won','lost')), 0) as total_profit,
  rank() over (
    order by (
      coalesce(sum(b.payout) filter (where b.result = 'won'), 0) -
      coalesce(sum(b.stake)  filter (where b.result in ('won','lost')), 0)
    ) desc
  ) as rank
from public.profiles p
left join public.punts b on b.user_id = p.id
group by p.id, p.full_name, p.avatar_initials, p.tier;

-- 6. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.punts    enable row level security;

-- Profiles: users can read all, only edit their own
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Punts: users can only see and manage their own
create policy "Users can view own punts"
  on public.punts for select
  using (auth.uid() = user_id);

create policy "Users can insert own punts"
  on public.punts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own punts"
  on public.punts for update
  using (auth.uid() = user_id);

create policy "Users can delete own punts"
  on public.punts for delete
  using (auth.uid() = user_id);

-- Leaderboard view is public
create policy "Leaderboard is public"
  on public.profiles for select using (true);
