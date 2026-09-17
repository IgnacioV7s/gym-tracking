-- Row Level Security. Security is enforced here, never in the client.
-- auth.uid() is wrapped in (select ...) so it is evaluated once per query.

-- Ownership helpers for child tables (security definer so they can read the
-- parent without the parent's own RLS re-running per row). Each one checks
-- auth.uid() explicitly.
create or replace function public.owns_routine(p_routine_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.routines r
    where r.id = p_routine_id and r.user_id = (select auth.uid())
  );
$$;

create or replace function public.owns_workout(p_workout_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.workouts w
    where w.id = p_workout_id and w.user_id = (select auth.uid())
  );
$$;

create or replace function public.owns_workout_exercise(p_workout_exercise_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = p_workout_exercise_id and w.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_routine(uuid) from public, anon;
revoke execute on function public.owns_workout(uuid) from public, anon;
revoke execute on function public.owns_workout_exercise(uuid) from public, anon;

-- profiles --------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- exercises -------------------------------------------------------------------
alter table public.exercises enable row level security;

create policy exercises_select_global_or_own on public.exercises
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy exercises_insert_own on public.exercises
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy exercises_update_own on public.exercises
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy exercises_delete_own on public.exercises
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- routines --------------------------------------------------------------------
alter table public.routines enable row level security;

create policy routines_all_own on public.routines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.routine_exercises enable row level security;

create policy routine_exercises_all_own on public.routine_exercises
  for all to authenticated
  using ((select public.owns_routine(routine_id)))
  with check ((select public.owns_routine(routine_id)));

-- workouts --------------------------------------------------------------------
alter table public.workouts enable row level security;

create policy workouts_all_own on public.workouts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.workout_exercises enable row level security;

create policy workout_exercises_all_own on public.workout_exercises
  for all to authenticated
  using ((select public.owns_workout(workout_id)))
  with check ((select public.owns_workout(workout_id)));

alter table public.workout_sets enable row level security;

create policy workout_sets_all_own on public.workout_sets
  for all to authenticated
  using ((select public.owns_workout_exercise(workout_exercise_id)))
  with check ((select public.owns_workout_exercise(workout_exercise_id)));
