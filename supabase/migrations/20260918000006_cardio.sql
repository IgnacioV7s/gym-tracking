-- Cardio support: sets can carry duration and distance instead of reps x weight.
alter table public.workout_sets
  add column duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  add column distance_m numeric(8, 1) check (distance_m is null or distance_m >= 0);

insert into public.exercises (id, user_id, name, name_en, primary_muscle, secondary_muscles, equipment) values
  ('a0000000-0000-4000-8000-000000000071', null, 'Cinta de correr',   'Treadmill',      'cardio', '{}', 'machine'),
  ('a0000000-0000-4000-8000-000000000072', null, 'Bicicleta estática', 'Stationary bike', 'cardio', '{}', 'machine'),
  ('a0000000-0000-4000-8000-000000000073', null, 'Elíptica',          'Elliptical',     'cardio', '{}', 'machine'),
  ('a0000000-0000-4000-8000-000000000074', null, 'Remo (máquina)',    'Rowing machine', 'cardio', '{}', 'machine'),
  ('a0000000-0000-4000-8000-000000000075', null, 'Saltar la cuerda',  'Jump rope',      'cardio', '{}', 'other'),
  ('a0000000-0000-4000-8000-000000000076', null, 'Escaladora',        'Stair climber',  'cardio', '{}', 'machine'),
  ('a0000000-0000-4000-8000-000000000077', null, 'Caminata',          'Walking',        'cardio', '{}', 'bodyweight');
