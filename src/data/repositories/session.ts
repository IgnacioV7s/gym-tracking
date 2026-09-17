import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/** Current user id from the locally persisted session (no network call). */
export async function requireUserId(client: SupabaseClient<Database>): Promise<string> {
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return session.user.id
}
