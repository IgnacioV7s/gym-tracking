import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WorkoutRepository } from '@/domain/repositories'
import type { WorkoutSetInput } from '@/domain/models'
import {
  WORKOUT_NESTED_SELECT,
  workoutFromRow,
  workoutSetFromRow,
  workoutSetToInsert,
  workoutSetToUpdate,
} from '@/data/mappers/workout'

export function createSupabaseWorkoutRepository(
  client: SupabaseClient<Database>,
): WorkoutRepository {
  async function fetchOne(id: string) {
    const { data, error } = await client
      .from('workouts')
      .select(WORKOUT_NESTED_SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? workoutFromRow(data) : null
  }

  return {
    async listBetween(from, to) {
      const { data, error } = await client
        .from('workouts')
        .select(WORKOUT_NESTED_SELECT)
        .not('finished_at', 'is', null)
        .gte('started_at', from)
        .lte('started_at', to)
        .order('started_at', { ascending: false })
      if (error) throw error
      return data.map(workoutFromRow)
    },

    get: fetchOne,

    async getActive() {
      const { data, error } = await client
        .from('workouts')
        .select(WORKOUT_NESTED_SELECT)
        .is('finished_at', null)
        .maybeSingle()
      if (error) throw error
      return data ? workoutFromRow(data) : null
    },

    async getLastFinished() {
      const { data, error } = await client
        .from('workouts')
        .select(WORKOUT_NESTED_SELECT)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ? workoutFromRow(data) : null
    },

    async setExercisePositions(entries) {
      // Unique (workout_id, position) is not deferred across requests, so park
      // rows at a high offset first, then write the final positions.
      for (const e of entries) {
        const { error } = await client
          .from('workout_exercises')
          .update({ position: e.position + 1000 })
          .eq('id', e.id)
        if (error) throw error
      }
      for (const e of entries) {
        const { error } = await client
          .from('workout_exercises')
          .update({ position: e.position })
          .eq('id', e.id)
        if (error) throw error
      }
    },

    async listByExercise(exerciseId) {
      // Inner join filters workouts to those containing the exercise; the
      // nested select still returns every exercise of each matched workout.
      const { data, error } = await client
        .from('workouts')
        .select(`${WORKOUT_NESTED_SELECT}, filter:workout_exercises!inner(exercise_id)`)
        .eq('filter.exercise_id', exerciseId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: true })
      if (error) throw error
      return data.map(workoutFromRow)
    },

    async start({ name, routineId, id }) {
      const { data, error } = await client
        .from('workouts')
        .insert({ ...(id ? { id } : {}), name, routine_id: routineId ?? null })
        .select(WORKOUT_NESTED_SELECT)
        .single()
      if (error) throw error
      return workoutFromRow(data)
    },

    async updateMeta(id, changes) {
      const { error } = await client.from('workouts').update(changes).eq('id', id)
      if (error) throw error
    },

    async finish(id, finishedAt) {
      const { error } = await client
        .from('workouts')
        .update({ finished_at: finishedAt })
        .eq('id', id)
      if (error) throw error
    },

    async remove(id) {
      const { error } = await client.from('workouts').delete().eq('id', id)
      if (error) throw error
    },

    async addExercise(workoutId, exerciseId, position, id) {
      const { data, error } = await client
        .from('workout_exercises')
        .insert({ ...(id ? { id } : {}), workout_id: workoutId, exercise_id: exerciseId, position })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    },

    async removeExercise(workoutExerciseId) {
      const { error } = await client.from('workout_exercises').delete().eq('id', workoutExerciseId)
      if (error) throw error
    },

    async updateExerciseNotes(workoutExerciseId, notes) {
      const { error } = await client
        .from('workout_exercises')
        .update({ notes })
        .eq('id', workoutExerciseId)
      if (error) throw error
    },

    async addSet(workoutExerciseId, position, input: WorkoutSetInput, id) {
      const { data, error } = await client
        .from('workout_sets')
        .insert({
          ...(id ? { id } : {}),
          ...workoutSetToInsert(workoutExerciseId, position, input),
        })
        .select('*')
        .single()
      if (error) throw error
      return workoutSetFromRow(data)
    },

    async updateSet(setId, input) {
      const { error } = await client
        .from('workout_sets')
        .update(workoutSetToUpdate(input))
        .eq('id', setId)
      if (error) throw error
    },

    async removeSet(setId) {
      const { error } = await client.from('workout_sets').delete().eq('id', setId)
      if (error) throw error
    },
  }
}
