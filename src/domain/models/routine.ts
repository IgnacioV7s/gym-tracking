export interface RoutineExercise {
  id: string
  exerciseId: string
  position: number
  targetSets: number
  targetReps: number
  targetWeightKg: number | null
  restSeconds: number | null
}

export interface Routine {
  id: string
  name: string
  notes: string | null
  exercises: RoutineExercise[]
  createdAt: string
  updatedAt: string
}

export interface RoutineExerciseInput {
  exerciseId: string
  targetSets: number
  targetReps: number
  targetWeightKg?: number | null
  restSeconds?: number | null
}

export interface RoutineInput {
  name: string
  notes?: string | null
  /** Ordered; position is derived from array index. */
  exercises: RoutineExerciseInput[]
}
