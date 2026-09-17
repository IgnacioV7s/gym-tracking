import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ProfileRepository } from '@/domain/repositories'
import type { Profile, ProfileUpdate } from '@/domain/models'
import { profileFromRow, profileToRowUpdate } from '@/data/mappers/profile'

export function createSupabaseProfileRepository(
  client: SupabaseClient<Database>,
): ProfileRepository {
  return {
    async getCurrent(): Promise<Profile> {
      // RLS restricts the table to the current user's single row.
      const { data, error } = await client.from('profiles').select('*').single()
      if (error) throw error
      return profileFromRow(data)
    },

    async updateCurrent(changes: ProfileUpdate): Promise<Profile> {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await client
        .from('profiles')
        .update(profileToRowUpdate(changes))
        .eq('id', user.id)
        .select('*')
        .single()
      if (error) throw error
      return profileFromRow(data)
    },
  }
}
