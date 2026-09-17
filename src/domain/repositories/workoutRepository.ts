import type { Workout, WorkoutSet, WorkoutSetInput, WorkoutSummary } from '@/domain/models'

export interface WorkoutRepository {
  /** Finished workouts started within [from, to], newest first. ISO strings. */
  listBetween(from: string, to: string): Promise<WorkoutSummary[]>
  get(id: string): Promise<Workout | null>
  /** The user's in-progress workout, if any. */
  getActive(): Promise<Workout | null>
  /** Full workouts that include the given exercise, oldest first. */
  listByExercise(exerciseId: string): Promise<Workout[]>

  start(input: { name: string; routineId?: string | null }): Promise<Workout>
  updateMeta(id: string, changes: { name?: string; notes?: string | null }): Promise<void>
  finish(id: string, finishedAt: string): Promise<void>
  remove(id: string): Promise<void>

  addExercise(workoutId: string, exerciseId: string, position: number): Promise<string>
  removeExercise(workoutExerciseId: string): Promise<void>
  updateExerciseNotes(workoutExerciseId: string, notes: string | null): Promise<void>

  addSet(workoutExerciseId: string, position: number, input: WorkoutSetInput): Promise<WorkoutSet>
  updateSet(setId: string, input: Partial<WorkoutSetInput>): Promise<void>
  removeSet(setId: string): Promise<void>
}
