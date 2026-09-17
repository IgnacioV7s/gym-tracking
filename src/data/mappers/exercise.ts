import type { Tables, TablesInsert } from '@/types/database'
import type { Exercise, ExerciseInput } from '@/domain/models'

export function exerciseFromRow(row: Tables<'exercises'>): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: row.secondary_muscles,
    equipment: row.equipment,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  }
}

export function exerciseToRow(
  input: ExerciseInput,
  userId: string,
): Omit<TablesInsert<'exercises'>, 'id'> {
  return {
    user_id: userId,
    name: input.name,
    primary_muscle: input.primaryMuscle,
    secondary_muscles: input.secondaryMuscles,
    equipment: input.equipment,
  }
}
