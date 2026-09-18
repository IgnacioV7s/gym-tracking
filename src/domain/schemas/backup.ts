import { z } from 'zod'
import { LOCALES, SET_TYPES } from '@/domain/models'
import { equipmentSchema, muscleGroupSchema } from './exercise'

export const BACKUP_VERSION = 1

const isoDate = z.string().datetime({ offset: true })

const backupExerciseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  primaryMuscle: muscleGroupSchema,
  secondaryMuscles: z.array(muscleGroupSchema),
  equipment: equipmentSchema,
  archivedAt: isoDate.nullable(),
})

const backupRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().nullable(),
  exercises: z.array(
    z.object({
      exerciseId: z.uuid(),
      targetSets: z.int().min(1).max(50),
      targetReps: z.int().min(1).max(500),
      targetWeightKg: z.number().min(0).nullable(),
      restSeconds: z.int().min(0).max(3600).nullable(),
    }),
  ),
})

const backupWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: isoDate,
  finishedAt: isoDate,
  notes: z.string().nullable(),
  exercises: z.array(
    z.object({
      exerciseId: z.uuid(),
      notes: z.string().nullable(),
      sets: z.array(
        z.object({
          reps: z.int().min(0).max(500),
          weightKg: z.number().min(0),
          rpe: z.number().min(1).max(10).nullable(),
          type: z.enum(SET_TYPES),
          completed: z.boolean(),
        }),
      ),
    }),
  ),
})

export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: isoDate,
  profile: z.object({
    displayName: z.string().nullable(),
    weightUnit: z.enum(['kg', 'lb']),
    theme: z.enum(['system', 'light', 'dark']),
    defaultRestSeconds: z.int().min(0).max(3600),
    oneRepMaxFormula: z.enum(['epley', 'brzycki']),
    locale: z.enum(LOCALES),
  }),
  /** Only the user's custom exercises; global catalog ids are referenced as-is. */
  exercises: z.array(backupExerciseSchema),
  routines: z.array(backupRoutineSchema),
  workouts: z.array(backupWorkoutSchema),
})

export type Backup = z.infer<typeof backupSchema>
