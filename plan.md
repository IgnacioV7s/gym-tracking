# gym-tracking — Plan de proyecto

> Documento canónico del proyecto. Cualquier agente de IA o persona que trabaje en este repo
> debe leerlo completo antes de tocar código. Si algo del plan cambia, se actualiza aquí primero.

---

## 0. Instrucciones para agentes de IA

1. **Lee este archivo entero** antes de implementar cualquier cosa.
2. **Trabaja por fases** (sección 8). No adelantes funcionalidad de fases futuras.
3. **Un commit por unidad lógica**, siguiendo el formato de la sección 9. Nunca amontones.
4. **Antes de commitear** ejecuta: `pnpm lint && pnpm type-check && pnpm test:unit --run`. Si falla, no commitees.
5. **Nada de dependencias nuevas** sin que estén listadas en la sección 2.1 o justificadas en un commit `chore(deps)`.
6. **Lógica de dominio pura** (`src/domain/`) sin imports de Vue, Pinia, Supabase ni del navegador. Se testea con Vitest sin DOM.
7. **Backend = Supabase**. Todo cambio de esquema va en una migración SQL en `supabase/migrations/`. Nunca editar tablas a mano en el dashboard sin dejar la migración en el repo.
8. **Seguridad**: toda tabla con datos de usuario tiene RLS habilitado y políticas por `auth.uid()`. Solo se usa la `anon key` en el cliente; la `service_role key` **jamás** entra al repo ni al frontend.
9. **Secretos** solo en `.env.local` (ignorado por git). `.env.example` documenta las variables sin valores reales.
10. Idioma: **UI en español**, **código, identificadores, SQL y commits en inglés**.
11. Cuando termines una tarea, marca la casilla correspondiente en la sección 8 en el mismo commit.
12. Comandos disponibles: ver sección 10. No inventes scripts que no estén en `package.json`.

---

## 1. Objetivo

App para registrar entrenamientos de gimnasio y analizar el progreso:

- Registrar sesiones: ejercicios, series, repeticiones, peso, RPE opcional, notas.
- Reutilizar rutinas (plantillas) para no re-tipear cada día.
- Historial completo consultable por ejercicio y por fecha.
- Análisis de tendencias: volumen, 1RM estimado, PRs, frecuencia; agrupado por semana / mes / rango libre.
- Cuenta de usuario (Supabase Auth): los datos viven en la nube y se acceden desde cualquier dispositivo.
- Instalable como PWA en el celular.

**Fuera de alcance (v1):** modo offline completo, social/compartir, nutrición, wearables.

---

## 2. Stack técnico

| Capa            | Tecnología                                        | Notas                                              |
| --------------- | ------------------------------------------------- | -------------------------------------------------- |
| Framework       | Vue 3.5 (`<script setup lang="ts">`, Composition) | Sin Options API                                    |
| Build           | Vite 8                                            | Alias `@` → `src/`                                 |
| Lenguaje        | TypeScript 6 (`strict`)                           | Sin `any`; usar `unknown` + narrowing              |
| Estado          | Pinia 4 (setup stores)                            | Un store por agregado de dominio                   |
| Routing         | Vue Router 5 (`createWebHistory`)                 | Rutas lazy; guard de autenticación                 |
| Backend         | **Supabase** (Postgres + Auth + PostgREST)        | Proyecto propio; CLI para migraciones y tipos      |
| Cliente BD      | `@supabase/supabase-js` v2                        | Tipos generados con `supabase gen types`           |
| Auth            | Supabase Auth: email + password, magic link       | Sesión persistida por el SDK (localStorage)        |
| UI              | **shadcn-vue** + Tailwind CSS v4 + lucide icons   | Componentes en `components/ui/` (generados, no editar a mano; `pnpm exec shadcn-vue add <c>`) |
| Gráficos        | **Chart.js** + `vue-chartjs`                      | Solo se importa en vistas de análisis              |
| Fechas          | **date-fns**                                      | Nunca `moment`; timestamps ISO/`timestamptz`       |
| Validación      | **Zod**                                           | Formularios + validación de import/export          |
| PWA             | `vite-plugin-pwa`                                 | Fase 8; cachea el shell, no los datos              |
| Unit tests      | Vitest 4 + `@vue/test-utils` + jsdom              | Repositorios mockeados por interfaz                |
| E2E             | Playwright                                        | Contra Supabase local (`supabase start`)           |
| Lint / formato  | oxlint + ESLint + Prettier                        | `semi: false`, `singleQuote`, width 100            |
| Package manager | pnpm                                              | Node `^22.18` o `>=24.12`                          |

### 2.1 Dependencias a agregar

```sh
pnpm add @supabase/supabase-js zod date-fns chart.js vue-chartjs tailwindcss @tailwindcss/vite @lucide/vue
pnpm add -D supabase vite-plugin-pwa shadcn-vue
# shadcn-vue añade por su cuenta: reka-ui, clsx, tailwind-merge, class-variance-authority, tw-animate-css, vue-sonner
```

### 2.2 Variables de entorno

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Se declaran en `env.d.ts` (`ImportMetaEnv`) y en `.env.example`. Para desarrollo local se usan los valores que imprime `supabase start`.

---

## 3. Arquitectura

Arquitectura en capas, con dependencia estrictamente hacia adentro:

```
┌──────────────────────────────────────────────────────────┐
│  views/  components/         (Vue, UI, routing)          │
│      ↓                                                   │
│  stores/                     (Pinia: estado + acciones)  │
│      ↓                                                   │
│  data/repositories/          (impl Supabase de las       │
│                               interfaces de domain)      │
│      ↓                                                   │
│  domain/                     (tipos, reglas, analytics)  │  ← puro, sin Vue/Supabase
└──────────────────────────────────────────────────────────┘
                     ↕ HTTPS (PostgREST / GoTrue)
┌──────────────────────────────────────────────────────────┐
│  supabase/                   (migraciones SQL, RLS, seed)│
└──────────────────────────────────────────────────────────┘
```

Reglas:

- `domain/` **no importa nada** de las capas de arriba ni de Supabase. Funciones puras + tipos + esquemas Zod.
- `data/` es la única capa que conoce `supabase-js`. Implementa las interfaces `*Repository` de `domain/` y **mapea** filas de BD (snake_case, tablas planas) ↔ modelos de dominio (camelCase, agregados anidados).
- `stores/` reciben los repositorios por inyección (factory) para testearse con mocks.
- `views/` son páginas ruteables; `components/` son piezas reutilizables sin acceso directo a repositorios.
- `domain/analytics/` recibe arrays ya cargados y devuelve series listas para graficar. Agregaciones pesadas pueden moverse a vistas/funciones SQL en v2 si hace falta.
- La **seguridad la impone la BD** (RLS), no el frontend. El cliente nunca filtra por `user_id` a mano: las políticas lo hacen.

---

## 4. Estructura de carpetas (objetivo)

```
supabase/
├── config.toml
├── migrations/
│   ├── 0001_initial_schema.sql   # tablas, índices, triggers updated_at
│   ├── 0002_rls_policies.sql     # RLS + políticas
│   └── 0003_seed_exercises.sql   # catálogo global de ejercicios
└── seed.sql                      # datos de prueba para entorno local
src/
├── main.ts
├── App.vue
├── router/
│   ├── index.ts
│   └── guards.ts                # rutas sin meta.public → redirige a /login?redirect=
├── lib/
│   └── supabase.ts              # createClient tipado (única instancia)
├── types/
│   └── database.ts              # GENERADO: `pnpm db:types`. No editar a mano.
├── domain/
│   ├── models/
│   │   ├── exercise.ts          # Exercise, MuscleGroup, Equipment
│   │   ├── routine.ts           # Routine, RoutineExercise
│   │   ├── workout.ts           # Workout, WorkoutExercise, WorkoutSet
│   │   ├── profile.ts           # Profile (preferencias del usuario)
│   │   └── index.ts
│   ├── schemas/                 # Zod: formularios + import/export
│   ├── repositories/            # SOLO interfaces
│   └── analytics/
│       ├── volume.ts
│       ├── oneRepMax.ts         # Epley / Brzycki
│       ├── personalRecords.ts
│       ├── frequency.ts
│       ├── trends.ts            # regresión lineal simple, deltas %
│       └── periods.ts           # agrupación semana / mes / custom
├── data/
│   ├── mappers/                 # row ↔ model
│   ├── repositories/            # SupabaseExerciseRepository, etc.
│   └── backup.ts                # export / import JSON validado con Zod
├── stores/
│   ├── auth.ts                  # sesión, user, signIn/signUp/signOut
│   ├── profile.ts               # unidades, tema, preferencias
│   ├── exercises.ts
│   ├── routines.ts
│   ├── workouts.ts
│   └── activeWorkout.ts         # sesión en curso (guardado incremental)
├── composables/
│   ├── useTimer.ts
│   └── usePeriod.ts
├── components/
│   ├── ui/                      # shadcn-vue (generado)
│   ├── layout/                  # BottomNav, AppHeader
│   ├── workout/
│   ├── routine/
│   └── charts/
├── views/
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── RegisterView.vue
│   ├── HomeView.vue
│   ├── WorkoutView.vue
│   ├── HistoryView.vue
│   ├── WorkoutDetailView.vue
│   ├── RoutinesView.vue
│   ├── RoutineEditView.vue
│   ├── ExercisesView.vue
│   ├── ExerciseDetailView.vue
│   ├── AnalyticsView.vue
│   └── SettingsView.vue
├── assets/
│   └── main.css                 # tailwind + tokens shadcn (tema claro/oscuro por clase .dark)
└── __tests__/
e2e/
└── *.spec.ts
```

---

## 5. Modelo de datos (Postgres)

Convenciones: tablas y columnas en `snake_case`, PK `uuid default gen_random_uuid()`, timestamps `timestamptz`, pesos en **kg** (`numeric(6,2)`), `user_id uuid references auth.users on delete cascade` en toda tabla de usuario.

### 5.1 Tablas

```sql
-- Preferencias del usuario (1:1 con auth.users; se crea por trigger al registrarse)
profiles (
  id                  uuid pk references auth.users on delete cascade,
  display_name        text,
  weight_unit         text not null default 'kg'    check (weight_unit in ('kg','lb')),
  theme               text not null default 'system' check (theme in ('system','light','dark')),
  default_rest_seconds int  not null default 90,
  one_rep_max_formula text not null default 'epley' check (one_rep_max_formula in ('epley','brzycki')),
  created_at, updated_at
)

-- Catálogo: user_id NULL = ejercicio global (seed); no NULL = custom del usuario
exercises (
  id uuid pk,
  user_id           uuid null references auth.users on delete cascade,
  name              text not null,
  primary_muscle    text not null,   -- enum muscle_group
  secondary_muscles text[] not null default '{}',
  equipment         text not null,   -- enum equipment
  archived_at       timestamptz null,
  created_at, updated_at
)

routines (
  id uuid pk, user_id uuid not null,
  name text not null, notes text,
  created_at, updated_at
)

routine_exercises (
  id uuid pk,
  routine_id       uuid not null references routines on delete cascade,
  exercise_id      uuid not null references exercises,
  position         int  not null,
  target_sets      int  not null,
  target_reps      int  not null,
  target_weight_kg numeric(6,2),
  rest_seconds     int,
  unique (routine_id, position)
)

workouts (
  id uuid pk, user_id uuid not null,
  routine_id  uuid null references routines on delete set null,
  name        text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz null,        -- NULL = en curso
  notes       text,
  created_at, updated_at
)

workout_exercises (
  id uuid pk,
  workout_id  uuid not null references workouts on delete cascade,
  exercise_id uuid not null references exercises,
  position    int not null,
  notes       text,
  unique (workout_id, position)
)

workout_sets (
  id uuid pk,
  workout_exercise_id uuid not null references workout_exercises on delete cascade,
  position   int not null,
  reps       int not null check (reps >= 0),
  weight_kg  numeric(6,2) not null check (weight_kg >= 0),
  rpe        numeric(3,1) check (rpe between 1 and 10),
  set_type   text not null default 'normal' check (set_type in ('normal','warmup','drop','failure')),
  completed  boolean not null default false,
  unique (workout_exercise_id, position)
)
```

Enums como `create type muscle_group as enum (...)` y `equipment as enum (...)`.

Índices: `workouts (user_id, started_at desc)`, `workout_exercises (exercise_id)`, `workout_sets (workout_exercise_id)`, `exercises (user_id, name)`, `routines (user_id, updated_at desc)`.

Trigger `set_updated_at()` en todas las tablas con `updated_at`. Trigger en `auth.users` → inserta fila en `profiles`.

`workout_exercises` y `workout_sets` no llevan `user_id`: su política RLS se resuelve por `exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())`.

### 5.2 RLS (resumen)

| Tabla               | select                              | insert / update / delete                     |
| ------------------- | ----------------------------------- | -------------------------------------------- |
| `profiles`          | `id = auth.uid()`                   | update solo propio; insert vía trigger       |
| `exercises`         | `user_id is null or user_id = uid`  | solo filas con `user_id = uid`               |
| `routines`          | `user_id = uid`                     | `user_id = uid`                              |
| `routine_exercises` | vía `routines` del uid              | vía `routines` del uid                       |
| `workouts`          | `user_id = uid`                     | `user_id = uid`                              |
| `workout_exercises` | vía `workouts` del uid              | vía `workouts` del uid                       |
| `workout_sets`      | vía `workout_exercises → workouts`  | idem                                         |

### 5.3 Modelo de dominio (TypeScript)

El dominio trabaja con agregados anidados; `data/mappers` convierte desde/hacia las filas planas.

```ts
interface Workout {
  id: string
  routineId?: string
  name: string
  startedAt: string
  finishedAt?: string
  notes?: string
  exercises: WorkoutExercise[]     // ← workout_exercises + workout_sets embebidos
}
interface WorkoutExercise { id: string; exerciseId: string; position: number; notes?: string; sets: WorkoutSet[] }
interface WorkoutSet {
  id: string; position: number; reps: number; weightKg: number
  rpe?: number; type: 'normal' | 'warmup' | 'drop' | 'failure'; completed: boolean
}
// Exercise, Routine, RoutineExercise, Profile: espejo camelCase de las tablas.
```

Lectura de una sesión completa: una sola query con embed de PostgREST
`workouts.select('*, workout_exercises(*, workout_sets(*))')`.

### 5.4 Migraciones y tipos

- `supabase migration new <name>` → SQL en `supabase/migrations/`. Nunca editar migraciones ya aplicadas en remoto.
- `pnpm db:types` regenera `src/types/database.ts`. Se commitea junto con la migración que lo cambió.
- Flujo: `supabase start` (local) → escribir migración → `supabase db reset` → verificar → commit → `supabase db push` al proyecto remoto.

### 5.5 Backup

`data/backup.ts` exporta `{ version, exportedAt, exercises (custom), routines, workouts, profile }` como JSON validado con Zod. Import v1 = insertar con IDs nuevos (no reemplaza). Sirve también como plan de salida de la plataforma.

---

## 6. Funcionalidades

### 6.1 Autenticación
- Registro y login con email + password; opción de magic link.
- Rutas protegidas por defecto (solo `meta.public: true` es libre); redirección a `/login?redirect=` y de vuelta tras autenticarse.
- Cerrar sesión desde Ajustes. Restaurar sesión al recargar (lo maneja el SDK; el store escucha `onAuthStateChange`).

### 6.2 Ejercicios
- Catálogo global (~40 ejercicios, seed) + ejercicios propios del usuario.
- Crear / editar / archivar ejercicios propios. Los globales no se editan.
- Buscar por nombre y filtrar por grupo muscular / equipo.
- Detalle: historial de series, mejor set, 1RM estimado, gráfico de progreso.

### 6.3 Rutinas
- Crear rutina con lista ordenada de ejercicios y objetivos (series × reps × peso).
- Duplicar, editar, eliminar.
- "Empezar entrenamiento desde rutina" → pre-carga la sesión con objetivos y último peso usado.

### 6.4 Sesión de entrenamiento (core)
- Empezar desde rutina o sesión libre. Se crea la fila `workouts` al iniciar (`finished_at = null`).
- Por ejercicio: agregar/quitar series; por serie: reps, peso, RPE, tipo, check de completada.
- Mostrar la serie equivalente de la última sesión ("anterior: 80 kg × 8").
- Temporizador de descanso que auto-inicia al completar una serie.
- **Guardado incremental**: cada cambio de serie hace `upsert` de esa fila (debounce 500 ms); UI optimista con indicador de "guardando / guardado / error". Si hay un `workout` con `finished_at null` al abrir la app, se ofrece reanudarlo.
- Finalizar → `finished_at = now()` + resumen (volumen, duración, PRs).

### 6.5 Historial
- Lista de sesiones por fecha (agrupada por semana), con volumen y duración, paginada por rango.
- Detalle de sesión, edición posterior, eliminación.
- Calendario mensual con días entrenados.

### 6.6 Análisis
Selector de período: **semana / mes / 3 meses / año / personalizado**, con comparación vs. período anterior.

| Métrica      | Definición                                                          |
| ------------ | ------------------------------------------------------------------- |
| Volumen      | Σ (reps × peso) de series `completed` con `set_type != 'warmup'`    |
| 1RM estimado | Epley: `w × (1 + reps/30)`; Brzycki: `w × 36 / (37 − reps)`         |
| PR           | Mejor 1RM estimado y mejor peso×reps por ejercicio, con fecha       |
| Frecuencia   | Sesiones por semana; series por grupo muscular por semana           |
| Tendencia    | Pendiente de regresión lineal sobre 1RM/volumen + delta % vs. prev. |
| Duración     | Promedio y total por período                                        |

v1: se cargan las sesiones del rango y se calcula en `domain/analytics`. Si el rango es grande, v2 mueve agregados a una vista SQL (`workout_set_facts`) o función RPC.

Gráficos: línea (1RM y volumen por ejercicio), barras (volumen semanal, series por músculo), heatmap de calendario.

### 6.7 Ajustes
- Perfil: nombre, unidad (kg/lb), tema, descanso por defecto, fórmula 1RM.
- Exportar / importar backup JSON.
- Cerrar sesión. Eliminar cuenta (v2: requiere Edge Function con service role).

---

## 7. UI / UX

- **Mobile-first**: se usa en el gym con una mano. Targets táctiles ≥ 44px, `inputmode="decimal"`, botones ± para reps/peso.
- Navegación inferior con 4 tabs: Inicio, Historial, Rutinas, Análisis. Ajustes desde Inicio.
- UI con **shadcn-vue** sobre Tailwind v4. Tema claro/oscuro vía clase `.dark` en `<html>` (store `profile` la aplica según preferencia `system | light | dark`). Sin fuentes externas.
- Estados de red visibles: skeletons al cargar, toasts en error, indicador de guardado en la sesión activa.
- Accesibilidad: labels en todos los inputs, roles ARIA en modales, foco visible, contraste AA.

---

## 8. Fases de implementación

Cada fase termina con la app funcionando y tests en verde. Marcar `[x]` al completar.

### Fase 0 — Base
- [x] Limpiar scaffold (`stores/counter.ts`, `App.vue` de ejemplo, README genérico, `install.ps1` si no pertenece al proyecto).
- [x] Agregar dependencias (2.1). Scripts `db:*` en `package.json` (sección 10).
- [x] `supabase init`; `.env.example`, tipado en `env.d.ts`.
- [x] `supabase start` + crear `.env.local` con los valores locales.
- [x] `lib/supabase.ts` con cliente tipado.
- [x] `assets/main.css` con tokens y tema. Layout base + navegación + rutas lazy placeholder.
- [x] shadcn-vue + Tailwind v4 configurados; componentes base (button, input, label, card, badge, separator, skeleton, dialog, sheet, tabs, sonner).

### Fase 1 — Esquema y seguridad
- [x] Migración `0001_initial_schema.sql` (tablas, enums, índices, triggers).
- [x] Migración `0002_rls_policies.sql` + trigger de creación de `profiles`.
- [x] Migración `0003_seed_exercises.sql` (catálogo global).
- [x] `pnpm db:types` → `src/types/database.ts`.
- [x] Test SQL de RLS (pgTAP en `supabase/tests/rls.test.sql`, `pnpm db:test`).

### Fase 2 — Autenticación
- [x] Store `auth` (sesión, `onAuthStateChange`).
- [x] `LoginView`, `RegisterView`, guard de auth (`meta.public` marca rutas públicas; el resto exige sesión), redirección post-login.
- [x] Store `profile` + `SettingsView` básica (preferencias, cerrar sesión).
- [x] E2E: registro → login → acceso a ruta protegida → logout.

### Fase 3 — Dominio y repositorios
- [x] `domain/models` + `domain/schemas` con tests.
- [x] Interfaces de repositorio en `domain/repositories`.
- [x] `data/mappers` (row ↔ model) con tests unitarios.
- [x] Implementaciones Supabase de repositorios (`exercises`, `routines`, `workouts`).

### Fase 4 — Ejercicios
- [ ] Store `exercises`.
- [ ] `ExercisesView`: lista global + propios, búsqueda, filtros, crear/editar/archivar.
- [ ] E2E: crear ejercicio custom y encontrarlo.

### Fase 5 — Sesión de entrenamiento
- [ ] Store `activeWorkout` con guardado incremental (upsert + debounce + estado de guardado).
- [ ] `WorkoutView`: agregar ejercicios, series, inputs, completar, "anterior".
- [ ] `useTimer` + `RestTimer`.
- [ ] Finalizar sesión + resumen. Reanudar sesión en curso.
- [ ] E2E: sesión libre completa.

### Fase 6 — Rutinas
- [ ] Store `routines`. `RoutinesView` + `RoutineEditView`.
- [ ] Empezar sesión desde rutina con pre-carga.
- [ ] E2E: crear rutina y empezar sesión desde ella.

### Fase 7 — Historial y análisis
- [ ] Store `workouts` (rango de fechas, paginación). `HistoryView`, `WorkoutDetailView`, calendario.
- [ ] `domain/analytics/*` con tests exhaustivos (sin datos, un dato, warmups excluidos, reps ≥ 37 en Brzycki).
- [ ] `usePeriod` + componentes de gráfico. `AnalyticsView`. `ExerciseDetailView`.

### Fase 8 — PWA, backup y pulido
- [ ] `vite-plugin-pwa` (shell cacheado; datos siempre desde red).
- [ ] Export / import JSON.
- [ ] Revisión de accesibilidad, estados vacíos, errores de red.
- [ ] README real: setup local con Supabase CLI, variables, despliegue.

---

## 9. Convenciones de Git

### 9.1 Ramas
- `main`: siempre desplegable, tests en verde, migraciones aplicadas en remoto.
- Trabajo en ramas `feat/<slug>`, `fix/<slug>`, `chore/<slug>`; merge a `main` con fast-forward o squash.

### 9.2 Mensajes de commit — Conventional Commits

```
<type>(<scope>): <descripción imperativa en inglés, minúscula, sin punto final>

[cuerpo opcional: qué y por qué, no cómo]

[footer opcional: BREAKING CHANGE:, Refs #issue, Co-Authored-By:]
```

**type**: `feat` | `fix` | `refactor` | `test` | `docs` | `chore` | `style` | `perf` | `build` | `ci`

**scope**: `db` | `auth` | `domain` | `data` | `store` | `ui` | `workout` | `routine` | `exercise` | `history` | `analytics` | `settings` | `pwa` | `router` | `deps` | `tooling` | `plan`

Ejemplos:

```
feat(db): add initial schema with workouts and sets
feat(db): enable rls policies for user-owned tables
feat(auth): add login view and route guard
feat(data): implement supabase workout repository with nested select
feat(workout): debounce set upserts during active session
fix(analytics): exclude warmup sets from volume calculation
test(analytics): cover one-rep-max edge cases with reps > 36
chore(db): regenerate database types
docs(plan): mark phase 2 as complete
```

Reglas:
- Título ≤ 72 caracteres.
- Un commit = un cambio lógico. Los tests van en el mismo commit que la funcionalidad. Una migración y sus tipos regenerados van juntos.
- Nunca commitear con lint, type-check o tests fallando.
- Los agentes de IA agregan su línea de atribución al final del cuerpo (`Co-Authored-By: ...`).

---

## 10. Comandos

```sh
pnpm install              # dependencias
pnpm dev                  # servidor de desarrollo
pnpm build                # type-check + build
pnpm preview              # servir el build
pnpm test:unit            # vitest (--run para una sola pasada)
pnpm test:e2e             # playwright (requiere supabase local levantado)
pnpm lint                 # oxlint + eslint --fix
pnpm type-check           # vue-tsc
pnpm format               # prettier sobre src/

# Scripts a agregar en package.json (Fase 0)
pnpm db:start             # supabase start
pnpm db:stop              # supabase stop
pnpm db:reset             # supabase db reset   (re-aplica migraciones + seed.sql en local)
pnpm db:migrate <name>    # supabase migration new <name>
pnpm db:push              # supabase db push    (aplica migraciones al proyecto remoto)
pnpm db:types             # supabase gen types typescript --local > src/types/database.ts
pnpm db:test              # supabase test db    (pgTAP en supabase/tests/)
```

Verificación mínima antes de cada commit:

```sh
pnpm lint && pnpm type-check && pnpm test:unit --run
```

---

## 11. Testing

| Nivel       | Qué cubre                                                     | Herramienta               | Ubicación                    |
| ----------- | ------------------------------------------------------------- | ------------------------- | ---------------------------- |
| Unit        | `domain/*` (100% de `analytics`), schemas, mappers, composables | Vitest                  | `*.spec.ts` junto al archivo |
| Store       | Stores con repositorios mockeados (interfaz de `domain`)      | Vitest                    | `*.spec.ts` junto al archivo |
| Componente  | Componentes con lógica (SetRow, RestTimer, selectores)        | Vitest + @vue/test-utils  | `*.spec.ts` junto al archivo |
| BD          | Políticas RLS, triggers                                       | pgTAP (`pnpm db:test`)    | `supabase/tests/`            |
| E2E         | Flujos críticos por fase contra Supabase local                | Playwright                | `e2e/*.spec.ts`              |

Principios: testear comportamiento, no implementación. Los repositorios Supabase se cubren con `src/data/repositories/repositories.integration.spec.ts` (corre contra Supabase local; se salta si no hay `VITE_SUPABASE_URL`). Los tests de analytics usan datasets pequeños con valores esperados calculados a mano en el propio test.

---

## 12. Decisiones de diseño (ADR resumido)

| #   | Decisión                                    | Razón                                                                              |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Supabase como backend                       | Postgres + Auth + API sin escribir servidor; multi-dispositivo; free tier suficiente. |
| 2   | Tablas relacionales planas (no JSONB)       | Consultas por ejercicio/fecha eficientes; integridad referencial; análisis en SQL en v2. |
| 3   | Seguridad por RLS, no por frontend          | La `anon key` es pública; la BD es la única barrera real.                          |
| 4   | Migraciones SQL versionadas en el repo      | Reproducible en local y CI; historial auditable; sin cambios manuales en dashboard. |
| 5   | Dominio puro + mappers                      | La UI y los cálculos no dependen de la forma de las tablas ni del SDK.             |
| 6   | Guardado incremental con upsert + debounce  | Sesión en el gym con red inestable: se pierde como máximo la última serie.         |
| 7   | Pesos siempre en kg en BD                   | Una sola fuente de verdad; conversión solo en presentación.                        |
| 8   | Chart.js                                    | Ligero, tree-shakeable, bien soportado en Vue.                                     |
| 9   | shadcn-vue + Tailwind                       | Componentes accesibles (reka-ui) copiados al repo, no dependencia opaca; velocidad de UI. |
| 10  | Sin modo offline en v1                      | Complejidad alta (cola + conflictos); se evalúa en v2 con cola local de mutaciones. |

---

## 13. Ideas para v2 (no implementar sin aprobación)

- Modo offline: cola local de mutaciones (IndexedDB) con reintento al reconectar.
- Agregados de análisis en vistas SQL / RPC para rangos grandes.
- Eliminar cuenta vía Edge Function.
- Rangos de reps objetivo y progresión automática de carga.
- Superseries / circuitos.
- Registro de peso corporal y medidas.
- Compartir rutinas entre usuarios.
