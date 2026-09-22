import type { Workout, WorkoutSet, WorkoutSetInput } from '@/domain/models'

export interface WorkoutRepository {
  /** Finished workouts (with exercises and sets) started within [from, to], newest first. ISO strings. */
  listBetween(from: string, to: string): Promise<Workout[]>
  get(id: string): Promise<Workout | null>
  /** The user's in-progress workout, if any. */
  getActive(): Promise<Workout | null>
  /** Most recent finished workout, if any. */
  getLastFinished(): Promise<Workout | null>
  /** Full workouts that include the given exercise, oldest first. */
  listByExercise(exerciseId: string): Promise<Workout[]>

  /** `id` lets the caller pick the primary key so the write can be replayed. */
  start(input: { name: string; routineId?: string | null; id?: string }): Promise<Workout>
  updateMeta(id: string, changes: { name?: string; notes?: string | null }): Promise<void>
  finish(id: string, finishedAt: string): Promise<void>
  remove(id: string): Promise<void>

  addExercise(workoutId: string, exerciseId: string, position: number, id?: string): Promise<string>
  removeExercise(workoutExerciseId: string): Promise<void>
  /** Sets positions for several exercises at once (used for reordering). */
  setExercisePositions(entries: { id: string; position: number }[]): Promise<void>
  updateExerciseNotes(workoutExerciseId: string, notes: string | null): Promise<void>

  addSet(
    workoutExerciseId: string,
    position: number,
    input: WorkoutSetInput,
    id?: string,
  ): Promise<WorkoutSet>
  updateSet(setId: string, input: Partial<WorkoutSetInput>): Promise<void>
  removeSet(setId: string): Promise<void>
}
