import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSetInput,
  WorkoutSummary,
} from '@/domain/models'

export type WorkoutRowNested = Tables<'workouts'> & {
  workout_exercises: (Tables<'workout_exercises'> & {
    workout_sets: Tables<'workout_sets'>[]
  })[]
}

/** PostgREST embed for a full workout. */
export const WORKOUT_NESTED_SELECT = '*, workout_exercises(*, workout_sets(*))'

export function workoutSetFromRow(row: Tables<'workout_sets'>): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    reps: row.reps,
    weightKg: row.weight_kg,
    rpe: row.rpe,
    type: row.set_type,
    completed: row.completed,
  }
}

export function workoutExerciseFromRow(
  row: WorkoutRowNested['workout_exercises'][number],
): WorkoutExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    position: row.position,
    notes: row.notes,
    sets: [...row.workout_sets].sort((a, b) => a.position - b.position).map(workoutSetFromRow),
  }
}

export function workoutFromRow(row: WorkoutRowNested): Workout {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    notes: row.notes,
    exercises: [...row.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map(workoutExerciseFromRow),
  }
}

export function workoutSummaryFromRow(row: Tables<'workouts'>): WorkoutSummary {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  }
}

export function workoutSetToInsert(
  workoutExerciseId: string,
  position: number,
  input: WorkoutSetInput,
): TablesInsert<'workout_sets'> {
  return {
    workout_exercise_id: workoutExerciseId,
    position,
    reps: input.reps,
    weight_kg: input.weightKg,
    rpe: input.rpe ?? null,
    set_type: input.type ?? 'normal',
    completed: input.completed ?? false,
  }
}

export function workoutSetToUpdate(input: Partial<WorkoutSetInput>): TablesUpdate<'workout_sets'> {
  const row: TablesUpdate<'workout_sets'> = {}
  if (input.reps !== undefined) row.reps = input.reps
  if (input.weightKg !== undefined) row.weight_kg = input.weightKg
  if (input.rpe !== undefined) row.rpe = input.rpe
  if (input.type !== undefined) row.set_type = input.type
  if (input.completed !== undefined) row.completed = input.completed
  return row
}
