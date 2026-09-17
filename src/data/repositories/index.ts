import { supabase } from '@/lib/supabase'
import { createSupabaseProfileRepository } from './supabaseProfileRepository'

/** Default repository instances wired to the app's Supabase client. */
export const repositories = {
  profile: createSupabaseProfileRepository(supabase),
}
