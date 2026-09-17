import type { Tables, TablesInsert } from '@/types/database'
import type { Routine, RoutineExercise, RoutineExerciseInput } from '@/domain/models'

export type RoutineRowWithExercises = Tables<'routines'> & {
  routine_exercises: Tables<'routine_exercises'>[]
}

export function routineExerciseFromRow(row: Tables<'routine_exercises'>): RoutineExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    position: row.position,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeightKg: row.target_weight_kg,
    restSeconds: row.rest_seconds,
  }
}

export function routineFromRow(row: RoutineRowWithExercises): Routine {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    exercises: [...row.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map(routineExerciseFromRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function routineExercisesToRows(
  routineId: string,
  exercises: RoutineExerciseInput[],
): TablesInsert<'routine_exercises'>[] {
  return exercises.map((e, position) => ({
    routine_id: routineId,
    exercise_id: e.exerciseId,
    position,
    target_sets: e.targetSets,
    target_reps: e.targetReps,
    target_weight_kg: e.targetWeightKg ?? null,
    rest_seconds: e.restSeconds ?? null,
  }))
}
