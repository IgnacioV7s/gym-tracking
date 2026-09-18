export const SET_TYPES = ['normal', 'warmup', 'drop', 'failure'] as const
export type SetType = (typeof SET_TYPES)[number]

export interface WorkoutSet {
  id: string
  position: number
  reps: number
  weightKg: number
  rpe: number | null
  type: SetType
  completed: boolean
  /** Cardio only. */
  durationSeconds: number | null
  distanceM: number | null
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  position: number
  notes: string | null
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  routineId: string | null
  name: string
  startedAt: string
  /** null while the session is in progress. */
  finishedAt: string | null
  notes: string | null
  exercises: WorkoutExercise[]
}

/** Lightweight row for lists; no nested exercises. */
export interface WorkoutSummary {
  id: string
  routineId: string | null
  name: string
  startedAt: string
  finishedAt: string | null
}

export interface WorkoutSetInput {
  reps: number
  weightKg: number
  rpe?: number | null
  type?: SetType
  completed?: boolean
  durationSeconds?: number | null
  distanceM?: number | null
}
