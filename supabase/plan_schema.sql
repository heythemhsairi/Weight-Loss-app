-- Steady — Coach Plan feature (fixed cycle that loops).
-- Apply after schema.sql. Adds the repeating-plan template tables and a link
-- column so logged meals can be matched back to the plan item that produced them.

-- ---------- coach_plan (single active plan) ----------
create table if not exists public.coach_plan (
  id           smallint primary key default 1 check (id = 1),
  name         text not null default 'Coach plan',
  cycle_length integer not null default 14 check (cycle_length between 1 and 60),
  start_date   date not null,
  active       boolean not null default true
);

-- ---------- plan_meals (template meals per cycle day) ----------
create table if not exists public.plan_meals (
  id        bigint generated always as identity primary key,
  day_index integer not null check (day_index >= 1),
  type      text not null default 'breakfast',
  name      text not null,
  calories  integer not null default 0,
  sort      integer not null default 0
);
create index if not exists plan_meals_day_idx on public.plan_meals (day_index);

-- ---------- plan_exercises (template exercises per cycle day) ----------
create table if not exists public.plan_exercises (
  id        bigint generated always as identity primary key,
  day_index integer not null check (day_index >= 1),
  name      text not null,
  sets      integer,
  reps      text,
  weight    text,
  sort      integer not null default 0
);
create index if not exists plan_exercises_day_idx on public.plan_exercises (day_index);

-- ---------- link logged items back to their plan template ----------
-- When a planned meal is ticked, we insert into meals with plan_meal_id set, so
-- the checklist knows it's "done" and unticking can remove exactly that row.
alter table public.meals add column if not exists plan_meal_id bigint;
alter table public.exercises add column if not exists plan_exercise_id bigint;

-- ---------- single-user RLS (mirror schema.sql) ----------
alter table public.coach_plan     enable row level security;
alter table public.plan_meals     enable row level security;
alter table public.plan_exercises enable row level security;

do $$
declare t text;
begin
  foreach t in array array['coach_plan','plan_meals','plan_exercises']
  loop
    execute format('drop policy if exists %I_anon_all on public.%I;', t, t);
    execute format(
      'create policy %I_anon_all on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;
