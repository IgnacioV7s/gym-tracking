import { z } from 'zod'
import { EQUIPMENT, MUSCLE_GROUPS } from '@/domain/models'

export const muscleGroupSchema = z.enum(MUSCLE_GROUPS)
export const equipmentSchema = z.enum(EQUIPMENT)

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  primaryMuscle: muscleGroupSchema,
  secondaryMuscles: z.array(muscleGroupSchema).max(5).default([]),
  equipment: equipmentSchema,
})
