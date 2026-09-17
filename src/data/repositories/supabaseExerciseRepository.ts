import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ExerciseRepository } from '@/domain/repositories'
import type { Exercise, ExerciseInput } from '@/domain/models'
import { exerciseFromRow, exerciseToRow } from '@/data/mappers/exercise'
import { requireUserId } from './session'

export function createSupabaseExerciseRepository(
  client: SupabaseClient<Database>,
): ExerciseRepository {
  async function setArchived(id: string, archived: boolean): Promise<Exercise> {
    const { data, error } = await client
      .from('exercises')
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return exerciseFromRow(data)
  }

  return {
    async list() {
      // RLS already limits rows to global (user_id null) + own.
      const { data, error } = await client.from('exercises').select('*').order('name')
      if (error) throw error
      return data.map(exerciseFromRow)
    },

    async create(input: ExerciseInput) {
      const userId = await requireUserId(client)
      const { data, error } = await client
        .from('exercises')
        .insert(exerciseToRow(input, userId))
        .select('*')
        .single()
      if (error) throw error
      return exerciseFromRow(data)
    },

    async update(id: string, input: ExerciseInput) {
      const { data, error } = await client
        .from('exercises')
        .update({
          name: input.name,
          primary_muscle: input.primaryMuscle,
          secondary_muscles: input.secondaryMuscles,
          equipment: input.equipment,
        })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return exerciseFromRow(data)
    },

    archive: (id) => setArchived(id, true),
    unarchive: (id) => setArchived(id, false),
  }
}
