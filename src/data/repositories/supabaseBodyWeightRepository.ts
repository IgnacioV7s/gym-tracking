import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BodyWeightRepository } from '@/domain/repositories'
import { requireUserId } from './session'

export function createSupabaseBodyWeightRepository(
  client: SupabaseClient<Database>,
): BodyWeightRepository {
  return {
    async listBetween(from, to) {
      const { data, error } = await client
        .from('body_weights')
        .select('date, weight_kg')
        .gte('date', from)
        .lte('date', to)
        .order('date')
      if (error) throw error
      return data.map((r) => ({ date: r.date, weightKg: r.weight_kg }))
    },

    async set(entry) {
      const { error } = await client
        .from('body_weights')
        .upsert({ date: entry.date, weight_kg: entry.weightKg }, { onConflict: 'user_id,date' })
      if (error) throw error
    },

    async remove(date) {
      const userId = await requireUserId(client)
      const { error } = await client
        .from('body_weights')
        .delete()
        .eq('user_id', userId)
        .eq('date', date)
      if (error) throw error
    },
  }
}
