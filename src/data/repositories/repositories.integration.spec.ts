// @vitest-environment node
// Integration test against the local Supabase stack (pnpm db:start).
// Skipped automatically when VITE_SUPABASE_URL is not set.
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createSupabaseExerciseRepository } from './supabaseExerciseRepository'
import { createSupabaseRoutineRepository } from './supabaseRoutineRepository'
import { createSupabaseWorkoutRepository } from './supabaseWorkoutRepository'
import { createSupabaseProfileRepository } from './supabaseProfileRepository'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const BENCH_PRESS = 'a0000000-0000-4000-8000-000000000001'
const SQUAT = 'a0000000-0000-4000-8000-000000000041'

describe.skipIf(!url || !anonKey)('supabase repositories (integration)', () => {
  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const exercises = createSupabaseExerciseRepository(client)
  const routines = createSupabaseRoutineRepository(client)
  const workouts = createSupabaseWorkoutRepository(client)
  const profile = createSupabaseProfileRepository(client)

  beforeAll(async () => {
    const { error } = await client.auth.signUp({
      email: `it-${Date.now()}@test.local`,
      password: 'secret123',
      options: { data: { display_name: 'Integration' } },
    })
    if (error) throw error
  })

  it('profile is created on signup and can be updated', async () => {
    expect((await profile.getCurrent()).displayName).toBe('Integration')
    const updated = await profile.updateCurrent({ weightUnit: 'lb', defaultRestSeconds: 60 })
    expect(updated).toMatchObject({ weightUnit: 'lb', defaultRestSeconds: 60 })
  })

  it('lists the global catalog and manages custom exercises', async () => {
    const before = await exercises.list()
    expect(before.some((e) => e.id === BENCH_PRESS && e.userId === null)).toBe(true)

    const created = await exercises.create({
      name: 'Mi ejercicio',
      primaryMuscle: 'chest',
      secondaryMuscles: ['triceps'],
      equipment: 'other',
    })
    expect(created.userId).not.toBeNull()

    const archived = await exercises.archive(created.id)
    expect(archived.archivedAt).not.toBeNull()
    expect((await exercises.unarchive(created.id)).archivedAt).toBeNull()

    const renamed = await exercises.update(created.id, { ...created, name: 'Renombrado' })
    expect(renamed.name).toBe('Renombrado')
  })

  it('creates, updates and deletes a routine with ordered exercises', async () => {
    const routine = await routines.create({
      name: 'Push',
      exercises: [
        { exerciseId: BENCH_PRESS, targetSets: 4, targetReps: 6, targetWeightKg: 80 },
        { exerciseId: SQUAT, targetSets: 3, targetReps: 10 },
      ],
    })
    expect(routine.exercises.map((e) => [e.exerciseId, e.position])).toEqual([
      [BENCH_PRESS, 0],
      [SQUAT, 1],
    ])

    const updated = await routines.update(routine.id, {
      name: 'Push v2',
      exercises: [{ exerciseId: SQUAT, targetSets: 5, targetReps: 5 }],
    })
    expect(updated.name).toBe('Push v2')
    expect(updated.exercises).toHaveLength(1)
    expect((await routines.list()).some((r) => r.id === routine.id)).toBe(true)

    await routines.remove(routine.id)
    expect(await routines.get(routine.id)).toBeNull()
  })

  it('runs a full workout lifecycle', async () => {
    expect(await workouts.getActive()).toBeNull()

    const started = await workouts.start({ name: 'Libre' })
    expect((await workouts.getActive())?.id).toBe(started.id)

    const weId = await workouts.addExercise(started.id, BENCH_PRESS, 0)
    const set1 = await workouts.addSet(weId, 0, { reps: 10, weightKg: 60, type: 'warmup' })
    await workouts.addSet(weId, 1, { reps: 8, weightKg: 80 })
    await workouts.updateSet(set1.id, { completed: true })
    await workouts.updateExerciseNotes(weId, 'buena sesión')

    const full = await workouts.get(started.id)
    expect(full?.exercises[0]?.sets.map((s) => [s.position, s.completed])).toEqual([
      [0, true],
      [1, false],
    ])
    expect(full?.exercises[0]?.notes).toBe('buena sesión')

    // A second active workout is rejected by the partial unique index.
    await expect(workouts.start({ name: 'Otra' })).rejects.toBeTruthy()

    const finishedAt = new Date().toISOString()
    await workouts.finish(started.id, finishedAt)
    expect(await workouts.getActive()).toBeNull()

    const from = new Date(Date.now() - 60_000).toISOString()
    const to = new Date(Date.now() + 60_000).toISOString()
    expect((await workouts.listBetween(from, to)).map((w) => w.id)).toContain(started.id)

    const byExercise = await workouts.listByExercise(BENCH_PRESS)
    expect(byExercise.map((w) => w.id)).toContain(started.id)
    expect(await workouts.listByExercise(SQUAT)).toHaveLength(0)

    await workouts.remove(started.id)
    expect(await workouts.get(started.id)).toBeNull()
  })
})
