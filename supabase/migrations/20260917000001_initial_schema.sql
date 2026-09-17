-- Initial schema: profiles, exercises, routines, workouts and their children.
-- Conventions: snake_case, uuid PKs, timestamptz, weights stored in kg.

create type public.muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'full_body', 'cardio'
);

create type public.equipment as enum (
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other'
);

create type public.set_type as enum ('normal', 'warmup', 'drop', 'failure');

-- Shared trigger to keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users, created by trigger on signup)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  display_name         text,
  weight_unit          text        not null default 'kg'     check (weight_unit in ('kg', 'lb')),
  theme                text        not null default 'system' check (theme in ('system', 'light', 'dark')),
  default_rest_seconds integer     not null default 90       check (default_rest_seconds between 0 and 3600),
  one_rep_max_formula  text        not null default 'epley'  check (one_rep_max_formula in ('epley', 'brzycki')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- exercises: user_id null = global catalog, otherwise user-owned custom
-- ---------------------------------------------------------------------------
create table public.exercises (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 100),
  primary_muscle    public.muscle_group not null,
  secondary_muscles public.muscle_group[] not null default '{}',
  equipment         public.equipment not null,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index exercises_user_id_name_idx on public.exercises (user_id, name);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------
create table public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routines_user_id_updated_at_idx on public.routines (user_id, updated_at desc);

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

create table public.routine_exercises (
  id               uuid primary key default gen_random_uuid(),
  routine_id       uuid not null references public.routines (id) on delete cascade,
  exercise_id      uuid not null references public.exercises (id),
  position         integer not null check (position >= 0),
  target_sets      integer not null check (target_sets between 1 and 50),
  target_reps      integer not null check (target_reps between 1 and 500),
  target_weight_kg numeric(6, 2) check (target_weight_kg >= 0),
  rest_seconds     integer check (rest_seconds between 0 and 3600),
  unique (routine_id, position) deferrable initially deferred
);

create index routine_exercises_exercise_id_idx on public.routine_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table public.workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id  uuid references public.routines (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 100),
  started_at  timestamptz not null default now(),
  finished_at timestamptz check (finished_at is null or finished_at >= started_at),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index workouts_user_id_started_at_idx on public.workouts (user_id, started_at desc);
create index workouts_routine_id_idx on public.workouts (routine_id);
-- At most one in-progress workout per user.
create unique index workouts_one_active_per_user_idx
  on public.workouts (user_id) where finished_at is null;

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

create table public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position    integer not null check (position >= 0),
  notes       text,
  unique (workout_id, position) deferrable initially deferred
);

create index workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);

create table public.workout_sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position            integer not null check (position >= 0),
  reps                integer not null check (reps between 0 and 500),
  weight_kg           numeric(6, 2) not null check (weight_kg >= 0),
  rpe                 numeric(3, 1) check (rpe between 1 and 10),
  set_type            public.set_type not null default 'normal',
  completed           boolean not null default false,
  unique (workout_exercise_id, position) deferrable initially deferred
);
