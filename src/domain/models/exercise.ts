export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
  'full_body',
  'cardio',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'other',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

export interface Exercise {
  id: string
  /** null = global catalog entry, otherwise the owner's user id. */
  userId: string | null
  name: string
  /** English name; only set on global catalog entries. */
  nameEn: string | null
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  archivedAt: string | null
  createdAt: string
}

export interface ExerciseInput {
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
}

/** Display name for the current locale; custom exercises have a single name. */
export function exerciseName(exercise: Pick<Exercise, 'name' | 'nameEn'>, locale: string): string {
  return locale === 'en' && exercise.nameEn ? exercise.nameEn : exercise.name
}
