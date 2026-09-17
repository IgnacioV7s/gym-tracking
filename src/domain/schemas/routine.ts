import { z } from 'zod'

export const routineExerciseInputSchema = z.object({
  exerciseId: z.uuid(),
  targetSets: z.int().min(1).max(50),
  targetReps: z.int().min(1).max(500),
  targetWeightKg: z.number().min(0).max(9999).nullable().optional(),
  restSeconds: z.int().min(0).max(3600).nullable().optional(),
})

export const routineInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.nameRequired').max(100),
  notes: z.string().trim().max(2000).nullable().optional(),
  exercises: z.array(routineExerciseInputSchema).min(1, 'validation.atLeastOneExercise'),
})
