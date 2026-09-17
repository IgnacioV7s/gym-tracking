import { describe, it, expect } from 'vitest'
import type { Workout, WorkoutSet } from '@/domain/models'
import { workoutDurationMinutes, workoutVolumeKg, workoutWorkingSets } from './volume'

function set(overrides: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: 's',
    position: 0,
    reps: 10,
    weightKg: 50,
    rpe: null,
    type: 'normal',
    completed: true,
    ...overrides,
  }
}

const workout: Workout = {
  id: 'w',
  routineId: null,
  name: 'x',
  startedAt: '2026-01-01T10:00:00Z',
  finishedAt: '2026-01-01T11:02:30Z',
  notes: null,
  exercises: [
    {
      id: 'e1',
      exerciseId: 'a',
      position: 0,
      notes: null,
      sets: [
        set({ reps: 10, weightKg: 40, type: 'warmup' }),
        set({ reps: 8, weightKg: 80 }),
        set({ reps: 8, weightKg: 80, completed: false }),
      ],
    },
    {
      id: 'e2',
      exerciseId: 'b',
      position: 1,
      notes: null,
      sets: [set({ reps: 12, weightKg: 20, type: 'drop' })],
    },
  ],
}

describe('volume', () => {
  it('sums reps x weight of completed non-warmup sets', () => {
    expect(workoutVolumeKg(workout)).toBe(8 * 80 + 12 * 20)
    expect(workoutWorkingSets(workout)).toBe(2)
  })

  it('is zero for an empty workout', () => {
    expect(workoutVolumeKg({ exercises: [] })).toBe(0)
  })

  it('computes duration in minutes only when finished', () => {
    expect(workoutDurationMinutes(workout)).toBe(63)
    expect(workoutDurationMinutes({ ...workout, finishedAt: null })).toBe(0)
    expect(
      workoutDurationMinutes({ startedAt: workout.finishedAt!, finishedAt: workout.startedAt }),
    ).toBe(0)
  })
})
