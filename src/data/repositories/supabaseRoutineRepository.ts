import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { RoutineRepository } from '@/domain/repositories'
import type { RoutineInput } from '@/domain/models'
import { routineFromRow, routineExercisesToRows } from '@/data/mappers/routine'

const ROUTINE_SELECT = '*, routine_exercises(*)'

export function createSupabaseRoutineRepository(
  client: SupabaseClient<Database>,
): RoutineRepository {
  async function fetchOne(id: string) {
    const { data, error } = await client
      .from('routines')
      .select(ROUTINE_SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? routineFromRow(data) : null
  }

  async function replaceExercises(routineId: string, input: RoutineInput) {
    const { error: delError } = await client
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId)
    if (delError) throw delError
    const { error: insError } = await client
      .from('routine_exercises')
      .insert(routineExercisesToRows(routineId, input.exercises))
    if (insError) throw insError
  }

  return {
    async list() {
      const { data, error } = await client
        .from('routines')
        .select(ROUTINE_SELECT)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data.map(routineFromRow)
    },

    get: fetchOne,

    async create(input: RoutineInput) {
      const { data, error } = await client
        .from('routines')
        .insert({ name: input.name, notes: input.notes ?? null })
        .select('id')
        .single()
      if (error) throw error
      await replaceExercises(data.id, input)
      const routine = await fetchOne(data.id)
      if (!routine) throw new Error('Routine vanished after insert')
      return routine
    },

    async update(id: string, input: RoutineInput) {
      const { error } = await client
        .from('routines')
        .update({ name: input.name, notes: input.notes ?? null })
        .eq('id', id)
      if (error) throw error
      await replaceExercises(id, input)
      const routine = await fetchOne(id)
      if (!routine) throw new Error('Routine not found')
      return routine
    },

    async remove(id: string) {
      const { error } = await client.from('routines').delete().eq('id', id)
      if (error) throw error
    },
  }
}
