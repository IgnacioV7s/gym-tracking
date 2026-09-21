import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Workout } from '@/domain/models'
import type { WorkoutRepository } from '@/domain/repositories'

vi.mock('@/data/repositories', () => ({ repositories: {} }))

import { createActiveWorkoutStore } from './activeWorkout'

let seq = 0
const id = (p: string) => `${p}${++seq}`

function repo(): WorkoutRepository {
  return {
    listBetween: vi.fn<WorkoutRepository['listBetween']>().mockResolvedValue([]),
    get: vi.fn<WorkoutRepository['get']>().mockResolvedValue(null),
    getActive: vi.fn<WorkoutRepository['getActive']>().mockResolvedValue(null),
    getLastFinished: vi.fn<WorkoutRepository['getLastFinished']>().mockResolvedValue(null),
    listByExercise: vi.fn<WorkoutRepository['listByExercise']>().mockResolvedValue([]),
    start: vi.fn<WorkoutRepository['start']>(async ({ name, routineId }) => ({
      id: id('w'),
      routineId: routineId ?? null,
      name,
      startedAt: 's',
      finishedAt: null,
      notes: null,
      exercises: [],
    })),
    updateMeta: vi.fn<WorkoutRepository['updateMeta']>().mockResolvedValue(),
    finish: vi.fn<WorkoutRepository['finish']>().mockResolvedValue(),
    remove: vi.fn<WorkoutRepository['remove']>().mockResolvedValue(),
    addExercise: vi.fn<WorkoutRepository['addExercise']>(async () => id('we')),
    removeExercise: vi.fn<WorkoutRepository['removeExercise']>().mockResolvedValue(),
    setExercisePositions: vi.fn<WorkoutRepository['setExercisePositions']>().mockResolvedValue(),
    updateExerciseNotes: vi.fn<WorkoutRepository['updateExerciseNotes']>().mockResolvedValue(),
    addSet: vi.fn<WorkoutRepository['addSet']>(async (_w, position, input) => ({
      id: id('s'),
      position,
      reps: input.reps,
      weightKg: input.weightKg,
      rpe: input.rpe ?? null,
      type: input.type ?? 'normal',
      completed: input.completed ?? false,
      durationSeconds: input.durationSeconds ?? null,
      distanceM: input.distanceM ?? null,
    })),
    updateSet: vi.fn<WorkoutRepository['updateSet']>().mockResolvedValue(),
    removeSet: vi.fn<WorkoutRepository['removeSet']>().mockResolvedValue(),
  }
}

describe('activeWorkout reorder, notes and repeat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    seq = 0
  })

  it('moves exercises and persists positions', async () => {
    const r = repo()
    const store = createActiveWorkoutStore(r)()
    await store.start('x')
    await store.addExercise('a')
    await store.addExercise('b')
    await store.addExercise('c')
    await store.moveExercise(store.workout!.exercises[2]!.id, -1)
    expect(store.workout!.exercises.map((e) => [e.exerciseId, e.position])).toEqual([
      ['a', 0],
      ['c', 1],
      ['b', 2],
    ])
    expect(r.setExercisePositions).toHaveBeenCalledWith(
      store.workout!.exercises.map((e) => ({ id: e.id, position: e.position })),
    )
    await store.moveExercise(store.workout!.exercises[0]!.id, -1)
    expect(r.setExercisePositions).toHaveBeenCalledTimes(1)
  })

  it('copies a past session with uncompleted sets', async () => {
    const r = repo()
    const store = createActiveWorkoutStore(r)()
    const source: Workout = {
      id: 'old',
      routineId: 'r1',
      name: 'Push',
      startedAt: 's',
      finishedAt: 'f',
      notes: null,
      exercises: [
        {
          id: 'oe',
          exerciseId: 'bench',
          position: 0,
          notes: 'n',
          sets: [
            {
              id: 'os',
              position: 0,
              reps: 8,
              weightKg: 80,
              rpe: 8,
              type: 'normal',
              completed: true,
              durationSeconds: null,
              distanceM: null,
            },
          ],
        },
      ],
    }
    const created = await store.startFromWorkout(source, 'Push')
    expect(created.routineId).toBe('r1')
    expect(created.exercises[0]!.sets[0]).toMatchObject({
      reps: 8,
      weightKg: 80,
      completed: false,
      rpe: null,
    })
    expect(created.exercises[0]!.notes).toBeNull()
  })
})
