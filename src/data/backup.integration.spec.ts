// @vitest-environment node
// Round-trips a backup through the local Supabase stack. Skipped without VITE_SUPABASE_URL.
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { exportBackup, importBackup, parseBackup } from './backup'
import { createSupabaseExerciseRepository } from './repositories/supabaseExerciseRepository'
import { createSupabaseRoutineRepository } from './repositories/supabaseRoutineRepository'
import { createSupabaseWorkoutRepository } from './repositories/supabaseWorkoutRepository'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const BENCH_PRESS = 'a0000000-0000-4000-8000-000000000001'

describe.skipIf(!url || !anonKey)('backup (integration)', () => {
  const source = createClient<Database>(url || 'http://localhost', anonKey || 'skipped', {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const target = createClient<Database>(url || 'http://localhost', anonKey || 'skipped', {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  beforeAll(async () => {
    for (const [client, tag] of [
      [source, 'src'],
      [target, 'dst'],
    ] as const) {
      const { error } = await client.auth.signUp({
        email: `bk-${tag}-${Date.now()}@test.local`,
        password: 'secret123',
        options: { data: { display_name: tag } },
      })
      if (error) throw error
    }
  })

  it('exports everything the user owns and imports it into another account', async () => {
    const exercises = createSupabaseExerciseRepository(source)
    const routines = createSupabaseRoutineRepository(source)
    const workouts = createSupabaseWorkoutRepository(source)

    const custom = await exercises.create({
      name: 'Custom lift',
      primaryMuscle: 'back',
      secondaryMuscles: [],
      equipment: 'other',
    })
    await routines.create({
      name: 'Pull',
      exercises: [
        { exerciseId: custom.id, targetSets: 3, targetReps: 8 },
        { exerciseId: BENCH_PRESS, targetSets: 2, targetReps: 5, targetWeightKg: 60 },
      ],
    })
    const w = await workouts.start({ name: 'Session' })
    const weId = await workouts.addExercise(w.id, custom.id, 0)
    await workouts.addSet(weId, 0, { reps: 8, weightKg: 40, completed: true })
    await workouts.finish(w.id, new Date().toISOString())

    const backup = await exportBackup(source)
    expect(backup.exercises.map((e) => e.name)).toEqual(['Custom lift'])
    expect(backup.routines[0]?.exercises.map((e) => e.exerciseId)).toEqual([custom.id, BENCH_PRESS])
    expect(backup.workouts[0]?.exercises[0]?.sets[0]).toMatchObject({ reps: 8, weightKg: 40 })

    const json = JSON.stringify(backup)
    const result = await importBackup(target, parseBackup(json))
    expect(result).toEqual({ exercises: 1, routines: 1, workouts: 1 })

    // The target account has its own copy of the custom exercise, rewired everywhere.
    const targetExercises = await createSupabaseExerciseRepository(target).list()
    const copied = targetExercises.find((e) => e.name === 'Custom lift')
    expect(copied).toBeDefined()
    expect(copied!.id).not.toBe(custom.id)
    const [routine] = await createSupabaseRoutineRepository(target).list()
    expect(routine?.exercises.map((e) => e.exerciseId)).toEqual([copied!.id, BENCH_PRESS])
    const [session] = await createSupabaseWorkoutRepository(target).listByExercise(copied!.id)
    expect(session?.exercises[0]?.sets[0]?.weightKg).toBe(40)
  })

  it('rejects malformed backups', () => {
    expect(() => parseBackup('{"version":2}')).toThrow(/version/)
  })
})
