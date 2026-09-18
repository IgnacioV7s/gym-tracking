import { describe, it, expect } from 'vitest'
import { exerciseInputSchema, routineInputSchema, workoutSetInputSchema } from './index'

const EXERCISE_ID = 'a0000000-0000-4000-8000-000000000001'

describe('exerciseInputSchema', () => {
  it('trims the name and defaults secondary muscles', () => {
    const parsed = exerciseInputSchema.parse({
      name: '  Press  ',
      primaryMuscle: 'chest',
      equipment: 'barbell',
    })
    expect(parsed).toEqual({
      name: 'Press',
      primaryMuscle: 'chest',
      secondaryMuscles: [],
      equipment: 'barbell',
    })
  })

  it('rejects an empty name and an unknown muscle', () => {
    expect(
      exerciseInputSchema.safeParse({ name: ' ', primaryMuscle: 'chest', equipment: 'other' })
        .success,
    ).toBe(false)
    expect(
      exerciseInputSchema.safeParse({ name: 'x', primaryMuscle: 'neck', equipment: 'other' })
        .success,
    ).toBe(false)
  })
})

describe('routineInputSchema', () => {
  it('requires at least one exercise', () => {
    expect(routineInputSchema.safeParse({ name: 'Push', exercises: [] }).success).toBe(false)
  })

  it('requires a uuid exercise id and integer targets', () => {
    const base = { name: 'Push' }
    expect(
      routineInputSchema.safeParse({
        ...base,
        exercises: [{ exerciseId: 'not-a-uuid', targetSets: 3, targetReps: 8 }],
      }).success,
    ).toBe(false)
    expect(
      routineInputSchema.safeParse({
        ...base,
        exercises: [{ exerciseId: EXERCISE_ID, targetSets: 3.5, targetReps: 8 }],
      }).success,
    ).toBe(false)
    expect(
      routineInputSchema.safeParse({
        ...base,
        exercises: [{ exerciseId: EXERCISE_ID, targetSets: 3, targetReps: 8 }],
      }).success,
    ).toBe(true)
  })
})

describe('workoutSetInputSchema', () => {
  it('applies defaults', () => {
    expect(workoutSetInputSchema.parse({ reps: 8, weightKg: 80 })).toEqual({
      reps: 8,
      weightKg: 80,
      type: 'normal',
      completed: false,
    })
  })

  it('accepts cardio fields', () => {
    expect(
      workoutSetInputSchema.safeParse({
        reps: 0,
        weightKg: 0,
        durationSeconds: 1200,
        distanceM: 3500,
      }).success,
    ).toBe(true)
  })

  it('bounds rpe between 1 and 10', () => {
    expect(workoutSetInputSchema.safeParse({ reps: 8, weightKg: 80, rpe: 11 }).success).toBe(false)
    expect(workoutSetInputSchema.safeParse({ reps: 8, weightKg: 80, rpe: 0.5 }).success).toBe(false)
    expect(workoutSetInputSchema.safeParse({ reps: 8, weightKg: 80, rpe: 8.5 }).success).toBe(true)
  })
})
