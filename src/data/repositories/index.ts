import { supabase } from '@/lib/supabase'
import { createSupabaseProfileRepository } from './supabaseProfileRepository'
import { createSupabaseExerciseRepository } from './supabaseExerciseRepository'
import { createSupabaseRoutineRepository } from './supabaseRoutineRepository'
import { createSupabaseWorkoutRepository } from './supabaseWorkoutRepository'

/** Default repository instances wired to the app's Supabase client. */
export const repositories = {
  profile: createSupabaseProfileRepository(supabase),
  exercises: createSupabaseExerciseRepository(supabase),
  routines: createSupabaseRoutineRepository(supabase),
  workouts: createSupabaseWorkoutRepository(supabase),
}
