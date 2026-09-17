import { z } from 'zod'
import { SET_TYPES } from '@/domain/models'

export const workoutSetInputSchema = z.object({
  reps: z.int().min(0).max(500),
  weightKg: z.number().min(0).max(9999),
  rpe: z.number().min(1).max(10).nullable().optional(),
  type: z.enum(SET_TYPES).default('normal'),
  completed: z.boolean().default(false),
})
