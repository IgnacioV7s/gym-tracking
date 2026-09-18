import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { RestDayRepository } from '@/domain/repositories'
import { requireUserId } from './session'

export function createSupabaseRestDayRepository(
  client: SupabaseClient<Database>,
): RestDayRepository {
  return {
    async listBetween(from, to) {
      const { data, error } = await client
        .from('rest_days')
        .select('date')
        .gte('date', from)
        .lte('date', to)
        .order('date')
      if (error) throw error
      return data.map((r) => r.date)
    },

    async add(date) {
      const { error } = await client
        .from('rest_days')
        .upsert({ date }, { onConflict: 'user_id,date' })
      if (error) throw error
    },

    async remove(date) {
      const userId = await requireUserId(client)
      const { error } = await client
        .from('rest_days')
        .delete()
        .eq('user_id', userId)
        .eq('date', date)
      if (error) throw error
    },
  }
}
