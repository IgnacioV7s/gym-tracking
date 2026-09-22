import { supabase } from '@/lib/supabase'
import { createSupabaseProfileRepository } from './supabaseProfileRepository'
import { createSupabaseExerciseRepository } from './supabaseExerciseRepository'
import { createSupabaseRoutineRepository } from './supabaseRoutineRepository'
import { createSupabaseWorkoutRepository } from './supabaseWorkoutRepository'
import { createSupabaseRestDayRepository } from './supabaseRestDayRepository'
import { createSupabaseBodyWeightRepository } from './supabaseBodyWeightRepository'
import { createOfflineWorkoutRepository } from '@/data/offline/offlineWorkoutRepository'

/** Exposed on its own so the UI can read `pending` and trigger `flush`. */
export const offlineWorkouts = createOfflineWorkoutRepository(
  createSupabaseWorkoutRepository(supabase),
)

/** Default repository instances wired to the app's Supabase client. */
export const repositories = {
  profile: createSupabaseProfileRepository(supabase),
  exercises: createSupabaseExerciseRepository(supabase),
  routines: createSupabaseRoutineRepository(supabase),
  /** Workout writes survive a dead connection; see data/offline. */
  workouts: offlineWorkouts,
  restDays: createSupabaseRestDayRepository(supabase),
  bodyWeights: createSupabaseBodyWeightRepository(supabase),
}
