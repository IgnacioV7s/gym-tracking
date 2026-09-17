-- RLS isolation tests. Run with `pnpm db:test` (supabase test db).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Two users. Inserting into auth.users fires handle_new_user -> profiles.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.local', '{"display_name":"Alice"}'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.local',   '{"display_name":"Bob"}');

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'signup trigger creates one profile per user'
);

-- Helper to impersonate an authenticated user through PostgREST-style claims.
create or replace function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- ---------------------------------------------------------------- Alice writes
select pg_temp.login('11111111-1111-4111-8111-111111111111');

select is((select auth.uid()), '11111111-1111-4111-8111-111111111111'::uuid, 'alice is logged in');

select is(
  (select display_name from public.profiles),
  'Alice',
  'alice only sees her own profile'
);

insert into public.exercises (user_id, name, primary_muscle, equipment)
values (auth.uid(), 'Alice custom', 'chest', 'other');

select is(
  (select count(*) from public.exercises where user_id is not null),
  1::bigint,
  'alice sees her custom exercise'
);

select ok(
  (select count(*) from public.exercises where user_id is null) > 30,
  'alice sees the global catalog'
);

insert into public.routines (id, name)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'Alice push');

insert into public.routine_exercises (routine_id, exercise_id, position, target_sets, target_reps)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 0, 3, 8);

insert into public.workouts (id, name)
values ('aaaaaaaa-0000-4000-8000-000000000002', 'Alice session');

insert into public.workout_exercises (id, workout_id, exercise_id, position)
values ('aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 0);

insert into public.workout_sets (workout_exercise_id, position, reps, weight_kg, completed)
values ('aaaaaaaa-0000-4000-8000-000000000003', 0, 8, 80, true);

select is((select count(*) from public.workout_sets), 1::bigint, 'alice sees her set');

select throws_ok(
  $$ insert into public.workouts (name, user_id) values ('spoof', '22222222-2222-4222-8222-222222222222') $$,
  '42501',
  null,
  'alice cannot insert a workout owned by bob'
);

-- ------------------------------------------------------------------ Bob reads
reset role;
select pg_temp.login('22222222-2222-4222-8222-222222222222');

select is((select display_name from public.profiles), 'Bob', 'bob only sees his own profile');
select is((select count(*) from public.exercises where user_id is not null), 0::bigint, 'bob does not see alice custom exercise');
select is((select count(*) from public.routines), 0::bigint, 'bob does not see alice routines');
select is((select count(*) from public.routine_exercises), 0::bigint, 'bob does not see alice routine exercises');
select is((select count(*) from public.workouts), 0::bigint, 'bob does not see alice workouts');
select is((select count(*) from public.workout_sets), 0::bigint, 'bob does not see alice sets');

-- Bob cannot attach a set to alice's workout exercise even knowing the id.
select throws_ok(
  $$ insert into public.workout_sets (workout_exercise_id, position, reps, weight_kg)
     values ('aaaaaaaa-0000-4000-8000-000000000003', 1, 5, 50) $$,
  '42501',
  null,
  'bob cannot insert sets into alice workout'
);

select * from finish();
rollback;
