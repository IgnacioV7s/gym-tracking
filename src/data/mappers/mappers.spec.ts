import { describe, it, expect } from 'vitest'
import { exerciseFromRow, exerciseToRow } from './exercise'
import { routineFromRow, routineExercisesToRows } from './routine'
import { workoutFromRow, workoutSetToInsert, workoutSetToUpdate } from './workout'

describe('exercise mappers', () => {
  it('maps rows both ways', () => {
    const row = {
      id: 'e1',
      user_id: null,
      name: 'Press',
      name_en: 'Bench press',
      primary_muscle: 'chest' as const,
      secondary_muscles: ['triceps' as const],
      equipment: 'barbell' as const,
      archived_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(exerciseFromRow(row)).toEqual({
      id: 'e1',
      userId: null,
      name: 'Press',
      nameEn: 'Bench press',
      primaryMuscle: 'chest',
      secondaryMuscles: ['triceps'],
      equipment: 'barbell',
      archivedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(
      exerciseToRow(
        { name: 'X', primaryMuscle: 'back', secondaryMuscles: [], equipment: 'cable' },
        'u1',
      ),
    ).toEqual({
      user_id: 'u1',
      name: 'X',
      primary_muscle: 'back',
      secondary_muscles: [],
      equipment: 'cable',
    })
  })
})

describe('routine mappers', () => {
  it('sorts exercises by position when reading', () => {
    const routine = routineFromRow({
      id: 'r1',
      user_id: 'u1',
      name: 'Push',
      notes: null,
      created_at: 'c',
      updated_at: 'u',
      routine_exercises: [
        {
          id: 'b',
          routine_id: 'r1',
          exercise_id: 'e2',
          position: 1,
          target_sets: 3,
          target_reps: 10,
          target_weight_kg: null,
          rest_seconds: null,
        },
        {
          id: 'a',
          routine_id: 'r1',
          exercise_id: 'e1',
          position: 0,
          target_sets: 4,
          target_reps: 6,
          target_weight_kg: 80,
          rest_seconds: 120,
        },
      ],
    })
    expect(routine.exercises.map((e) => e.id)).toEqual(['a', 'b'])
    expect(routine.exercises[0]).toMatchObject({ targetWeightKg: 80, restSeconds: 120 })
  })

  it('derives position from array index when writing', () => {
    const rows = routineExercisesToRows('r1', [
      { exerciseId: 'e1', targetSets: 3, targetReps: 8 },
      { exerciseId: 'e2', targetSets: 3, targetReps: 12, targetWeightKg: 20 },
    ])
    expect(rows.map((r) => r.position)).toEqual([0, 1])
    expect(rows[0]).toMatchObject({ target_weight_kg: null, rest_seconds: null })
    expect(rows[1]).toMatchObject({ target_weight_kg: 20 })
  })
})

describe('workout mappers', () => {
  it('maps a nested row and sorts exercises and sets', () => {
    const workout = workoutFromRow({
      id: 'w1',
      user_id: 'u1',
      routine_id: null,
      name: 'Libre',
      started_at: 's',
      finished_at: null,
      notes: null,
      created_at: 'c',
      updated_at: 'u',
      workout_exercises: [
        {
          id: 'we2',
          workout_id: 'w1',
          exercise_id: 'e2',
          position: 1,
          notes: null,
          workout_sets: [],
        },
        {
          id: 'we1',
          workout_id: 'w1',
          exercise_id: 'e1',
          position: 0,
          notes: 'ok',
          workout_sets: [
            {
              id: 's2',
              workout_exercise_id: 'we1',
              position: 1,
              reps: 8,
              weight_kg: 82.5,
              rpe: null,
              set_type: 'normal',
              completed: false,
              duration_seconds: null,
              distance_m: null,
            },
            {
              id: 's1',
              workout_exercise_id: 'we1',
              position: 0,
              reps: 10,
              weight_kg: 60,
              rpe: 6,
              set_type: 'warmup',
              completed: true,
              duration_seconds: null,
              distance_m: null,
            },
          ],
        },
      ],
    })
    expect(workout.exercises.map((e) => e.id)).toEqual(['we1', 'we2'])
    expect(workout.exercises[0]?.sets.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(workout.exercises[0]?.sets[0]).toEqual({
      id: 's1',
      position: 0,
      reps: 10,
      weightKg: 60,
      rpe: 6,
      type: 'warmup',
      completed: true,
      durationSeconds: null,
      distanceM: null,
    })
  })

  it('builds set inserts with defaults and partial updates', () => {
    expect(workoutSetToInsert('we1', 2, { reps: 5, weightKg: 100 })).toEqual({
      workout_exercise_id: 'we1',
      position: 2,
      reps: 5,
      weight_kg: 100,
      rpe: null,
      set_type: 'normal',
      completed: false,
      duration_seconds: null,
      distance_m: null,
    })
    expect(workoutSetToUpdate({ completed: true, rpe: 9 })).toEqual({ completed: true, rpe: 9 })
    expect(workoutSetToUpdate({})).toEqual({})
  })
})
