-- i18n: user locale preference and English names for the global catalog.

alter table public.profiles
  add column locale text not null default 'es' check (locale in ('es', 'en'));

-- Only global exercises carry a translation; user-owned ones keep name_en null.
alter table public.exercises
  add column name_en text check (char_length(name_en) between 1 and 100);

update public.exercises set name_en = v.name_en
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Bench press'),
  ('a0000000-0000-4000-8000-000000000002', 'Incline bench press'),
  ('a0000000-0000-4000-8000-000000000003', 'Dumbbell bench press'),
  ('a0000000-0000-4000-8000-000000000004', 'Incline dumbbell press'),
  ('a0000000-0000-4000-8000-000000000005', 'Cable fly'),
  ('a0000000-0000-4000-8000-000000000006', 'Dips'),
  ('a0000000-0000-4000-8000-000000000007', 'Push-up'),
  ('a0000000-0000-4000-8000-000000000011', 'Deadlift'),
  ('a0000000-0000-4000-8000-000000000012', 'Pull-up'),
  ('a0000000-0000-4000-8000-000000000013', 'Lat pulldown'),
  ('a0000000-0000-4000-8000-000000000014', 'Barbell row'),
  ('a0000000-0000-4000-8000-000000000015', 'Dumbbell row'),
  ('a0000000-0000-4000-8000-000000000016', 'Seated cable row'),
  ('a0000000-0000-4000-8000-000000000017', 'Machine row'),
  ('a0000000-0000-4000-8000-000000000021', 'Overhead press'),
  ('a0000000-0000-4000-8000-000000000022', 'Dumbbell shoulder press'),
  ('a0000000-0000-4000-8000-000000000023', 'Lateral raise'),
  ('a0000000-0000-4000-8000-000000000024', 'Cable lateral raise'),
  ('a0000000-0000-4000-8000-000000000025', 'Rear delt fly'),
  ('a0000000-0000-4000-8000-000000000026', 'Face pull'),
  ('a0000000-0000-4000-8000-000000000031', 'Barbell curl'),
  ('a0000000-0000-4000-8000-000000000032', 'Dumbbell curl'),
  ('a0000000-0000-4000-8000-000000000033', 'Hammer curl'),
  ('a0000000-0000-4000-8000-000000000034', 'Cable curl'),
  ('a0000000-0000-4000-8000-000000000035', 'Triceps pushdown'),
  ('a0000000-0000-4000-8000-000000000036', 'Skull crusher'),
  ('a0000000-0000-4000-8000-000000000037', 'Overhead triceps extension'),
  ('a0000000-0000-4000-8000-000000000038', 'Close-grip bench press'),
  ('a0000000-0000-4000-8000-000000000041', 'Squat'),
  ('a0000000-0000-4000-8000-000000000042', 'Front squat'),
  ('a0000000-0000-4000-8000-000000000043', 'Leg press'),
  ('a0000000-0000-4000-8000-000000000044', 'Leg extension'),
  ('a0000000-0000-4000-8000-000000000045', 'Lunge'),
  ('a0000000-0000-4000-8000-000000000046', 'Bulgarian split squat'),
  ('a0000000-0000-4000-8000-000000000047', 'Romanian deadlift'),
  ('a0000000-0000-4000-8000-000000000048', 'Leg curl'),
  ('a0000000-0000-4000-8000-000000000049', 'Hip thrust'),
  ('a0000000-0000-4000-8000-000000000050', 'Calf raise'),
  ('a0000000-0000-4000-8000-000000000061', 'Plank'),
  ('a0000000-0000-4000-8000-000000000062', 'Cable crunch'),
  ('a0000000-0000-4000-8000-000000000063', 'Leg raise')
) as v(id, name_en)
where public.exercises.id = v.id::uuid;
