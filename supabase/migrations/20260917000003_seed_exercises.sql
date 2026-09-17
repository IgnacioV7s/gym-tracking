-- Global exercise catalog (user_id = null). Fixed UUIDs so local and remote
-- environments share the same ids and backups stay portable.

insert into public.exercises (id, user_id, name, primary_muscle, secondary_muscles, equipment) values
  -- chest
  ('a0000000-0000-4000-8000-000000000001', null, 'Press de banca',                  'chest',      '{triceps,shoulders}', 'barbell'),
  ('a0000000-0000-4000-8000-000000000002', null, 'Press de banca inclinado',        'chest',      '{triceps,shoulders}', 'barbell'),
  ('a0000000-0000-4000-8000-000000000003', null, 'Press con mancuernas',            'chest',      '{triceps,shoulders}', 'dumbbell'),
  ('a0000000-0000-4000-8000-000000000004', null, 'Press inclinado con mancuernas',  'chest',      '{triceps,shoulders}', 'dumbbell'),
  ('a0000000-0000-4000-8000-000000000005', null, 'Aperturas en polea',              'chest',      '{}',                  'cable'),
  ('a0000000-0000-4000-8000-000000000006', null, 'Fondos en paralelas',             'chest',      '{triceps}',           'bodyweight'),
  ('a0000000-0000-4000-8000-000000000007', null, 'Flexiones',                       'chest',      '{triceps,shoulders}', 'bodyweight'),
  -- back
  ('a0000000-0000-4000-8000-000000000011', null, 'Peso muerto',                     'back',       '{hamstrings,glutes}', 'barbell'),
  ('a0000000-0000-4000-8000-000000000012', null, 'Dominadas',                       'back',       '{biceps}',            'bodyweight'),
  ('a0000000-0000-4000-8000-000000000013', null, 'Jalón al pecho',                  'back',       '{biceps}',            'cable'),
  ('a0000000-0000-4000-8000-000000000014', null, 'Remo con barra',                  'back',       '{biceps}',            'barbell'),
  ('a0000000-0000-4000-8000-000000000015', null, 'Remo con mancuerna',              'back',       '{biceps}',            'dumbbell'),
  ('a0000000-0000-4000-8000-000000000016', null, 'Remo en polea baja',              'back',       '{biceps}',            'cable'),
  ('a0000000-0000-4000-8000-000000000017', null, 'Remo en máquina',                 'back',       '{biceps}',            'machine'),
  -- shoulders
  ('a0000000-0000-4000-8000-000000000021', null, 'Press militar',                   'shoulders',  '{triceps}',           'barbell'),
  ('a0000000-0000-4000-8000-000000000022', null, 'Press de hombros con mancuernas', 'shoulders',  '{triceps}',           'dumbbell'),
  ('a0000000-0000-4000-8000-000000000023', null, 'Elevaciones laterales',           'shoulders',  '{}',                  'dumbbell'),
  ('a0000000-0000-4000-8000-000000000024', null, 'Elevaciones laterales en polea',  'shoulders',  '{}',                  'cable'),
  ('a0000000-0000-4000-8000-000000000025', null, 'Pájaros (deltoide posterior)',    'shoulders',  '{back}',              'dumbbell'),
  ('a0000000-0000-4000-8000-000000000026', null, 'Face pull',                       'shoulders',  '{back}',              'cable'),
  -- arms
  ('a0000000-0000-4000-8000-000000000031', null, 'Curl con barra',                  'biceps',     '{forearms}',          'barbell'),
  ('a0000000-0000-4000-8000-000000000032', null, 'Curl con mancuernas',             'biceps',     '{forearms}',          'dumbbell'),
  ('a0000000-0000-4000-8000-000000000033', null, 'Curl martillo',                   'biceps',     '{forearms}',          'dumbbell'),
  ('a0000000-0000-4000-8000-000000000034', null, 'Curl en polea',                   'biceps',     '{}',                  'cable'),
  ('a0000000-0000-4000-8000-000000000035', null, 'Extensión de tríceps en polea',   'triceps',    '{}',                  'cable'),
  ('a0000000-0000-4000-8000-000000000036', null, 'Press francés',                   'triceps',    '{}',                  'barbell'),
  ('a0000000-0000-4000-8000-000000000037', null, 'Extensión de tríceps sobre cabeza', 'triceps',  '{}',                  'dumbbell'),
  ('a0000000-0000-4000-8000-000000000038', null, 'Press cerrado',                   'triceps',    '{chest}',             'barbell'),
  -- legs
  ('a0000000-0000-4000-8000-000000000041', null, 'Sentadilla',                      'quads',      '{glutes,hamstrings}', 'barbell'),
  ('a0000000-0000-4000-8000-000000000042', null, 'Sentadilla frontal',              'quads',      '{glutes}',            'barbell'),
  ('a0000000-0000-4000-8000-000000000043', null, 'Prensa de piernas',               'quads',      '{glutes}',            'machine'),
  ('a0000000-0000-4000-8000-000000000044', null, 'Extensión de cuádriceps',         'quads',      '{}',                  'machine'),
  ('a0000000-0000-4000-8000-000000000045', null, 'Zancadas',                        'quads',      '{glutes}',            'dumbbell'),
  ('a0000000-0000-4000-8000-000000000046', null, 'Sentadilla búlgara',              'quads',      '{glutes}',            'dumbbell'),
  ('a0000000-0000-4000-8000-000000000047', null, 'Peso muerto rumano',              'hamstrings', '{glutes,back}',       'barbell'),
  ('a0000000-0000-4000-8000-000000000048', null, 'Curl femoral',                    'hamstrings', '{}',                  'machine'),
  ('a0000000-0000-4000-8000-000000000049', null, 'Hip thrust',                      'glutes',     '{hamstrings}',        'barbell'),
  ('a0000000-0000-4000-8000-000000000050', null, 'Elevación de talones',            'calves',     '{}',                  'machine'),
  -- core
  ('a0000000-0000-4000-8000-000000000061', null, 'Plancha',                         'abs',        '{}',                  'bodyweight'),
  ('a0000000-0000-4000-8000-000000000062', null, 'Crunch en polea',                 'abs',        '{}',                  'cable'),
  ('a0000000-0000-4000-8000-000000000063', null, 'Elevación de piernas',            'abs',        '{}',                  'bodyweight');
