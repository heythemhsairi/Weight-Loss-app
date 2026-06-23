-- Steady — Supabase schema (single-user mode)
-- Run this in your NEW Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Single-user mode: every row is owned by one fixed user id. We keep the column
-- (so multi-user/RLS can be layered on later) but default it to a constant.

create extension if not exists "pgcrypto";

-- Fixed owner for single-user mode.
do $$ begin
  perform 1;
end $$;

-- ---------- profile ----------
create table if not exists public.profile (
  id                  smallint primary key default 1 check (id = 1),
  name                text,
  age                 integer,
  sex                 text,
  height_cm           real,
  coach_name          text,
  coach_contact       text,
  disclaimer_accepted boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ---------- goal ----------
create table if not exists public.goal (
  id                   smallint primary key default 1 check (id = 1),
  start_weight         real not null,
  start_date           date not null,
  target_weight        real not null,
  target_date          date,
  weekly_rate_target   real,
  daily_calorie_target integer,
  status               text not null default 'active'
);

-- ---------- weight_entries ----------
create table if not exists public.weight_entries (
  id     bigint generated always as identity primary key,
  date   date not null unique,
  weight real not null,
  note   text
);

-- ---------- meals ----------
create table if not exists public.meals (
  id         bigint generated always as identity primary key,
  date       date not null,
  type       text not null,
  name       text not null,
  calories   integer not null default 0,
  adherence  text not null default 'followed', -- followed | partial | cheated
  is_cheat   boolean not null default false,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists meals_date_idx on public.meals (date);

-- ---------- workouts ----------
create table if not exists public.workouts (
  id        bigint generated always as identity primary key,
  date      date not null unique,
  day_type  text not null default 'training', -- training | rest
  status    text not null default 'planned',  -- planned | completed | missed | partial
  title     text,
  note      text
);

-- ---------- exercises ----------
create table if not exists public.exercises (
  id         bigint generated always as identity primary key,
  workout_id bigint not null references public.workouts(id) on delete cascade,
  name       text not null,
  sets       integer,
  reps       text,
  weight     text,
  completed  boolean not null default false
);
create index if not exists exercises_workout_idx on public.exercises (workout_id);

-- ---------- checkins ----------
create table if not exists public.checkins (
  id            bigint generated always as identity primary key,
  date          date not null unique,
  mood          integer,
  energy        integer,
  motivation    integer,
  can_train     text,    -- yes | no | unsure
  sleep_quality integer,
  sleep_hours   real,
  stress        integer,
  note          text
);

-- ---------- single-user access ----------
-- No auth in this mode: allow the anon key full access to these tables only.
-- (When you add Supabase Auth later, replace these with per-user RLS policies.)
alter table public.profile        enable row level security;
alter table public.goal           enable row level security;
alter table public.weight_entries enable row level security;
alter table public.meals          enable row level security;
alter table public.workouts       enable row level security;
alter table public.exercises      enable row level security;
alter table public.checkins       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profile','goal','weight_entries','meals','workouts','exercises','checkins']
  loop
    execute format('drop policy if exists %I_anon_all on public.%I;', t, t);
    execute format(
      'create policy %I_anon_all on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;
