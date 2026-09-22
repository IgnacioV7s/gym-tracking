# gym-tracking

App móvil (PWA) para registrar entrenamientos de gimnasio y analizar el progreso: ejercicios, rutinas, sesiones con series/reps/peso, historial, 1RM estimado, récords y tendencias. Español e inglés.

Stack: Vue 3 + Vite + Pinia + shadcn-vue/Tailwind, Supabase (Postgres + Auth + RLS).

Producción: https://gym-tracking-ten.vercel.app

La arquitectura, decisiones y el plan por fases están en [`plan.md`](./plan.md). Léelo antes de contribuir.

## Requisitos

- Node 22.18+ o 24.12+, pnpm
- Docker Desktop (para Supabase local)

## Setup local

```sh
pnpm install
cp .env.example .env.local        # completar con los valores de `pnpm db:start`
pnpm db:start                     # levanta Postgres, Auth, API y Studio en Docker
pnpm dev                          # http://localhost:5173
```

Servicios locales: API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`, Mailpit (correos) `http://127.0.0.1:54324`.

## Comandos

```sh
pnpm dev / build / preview
pnpm lint / type-check / format
pnpm test:unit --run              # vitest (incluye integración contra Supabase local si está arriba)
pnpm test:e2e --project=chromium  # playwright, requiere Supabase local
pnpm db:migrate <name>            # nueva migración
pnpm db:migrate:up                # aplica migraciones nuevas sin borrar datos
pnpm db:reset                     # BORRA la BD local y re-aplica todo
pnpm db:types                     # regenera src/types/database.ts
pnpm db:test                      # pgTAP (RLS)
pnpm db:push                      # aplica migraciones al proyecto remoto
```

Antes de cada commit: `pnpm lint && pnpm type-check && pnpm test:unit --run`.

## Despliegue

Ver Fase 11 en `plan.md`: proyecto en supabase.com (`supabase link` + `db push`), SMTP propio para correos de auth, y hosting estático del frontend con las variables `VITE_SUPABASE_*` del proyecto remoto.
