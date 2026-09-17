# gym-tracking

App para registrar entrenamientos de gimnasio y analizar el progreso. Vue 3 + Vite + Pinia, con Supabase como backend.

Toda la arquitectura, decisiones y fases están en [`plan.md`](./plan.md). Léelo antes de contribuir.

## Setup

```sh
pnpm install
cp .env.example .env.local   # completar con los valores de `pnpm db:start`
pnpm db:start                # requiere Docker corriendo
pnpm dev
```

## Comandos

Ver la sección 10 de `plan.md`.
