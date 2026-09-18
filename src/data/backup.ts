import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { BACKUP_VERSION, backupSchema, type Backup } from '@/domain/schemas/backup'
import { exerciseFromRow } from '@/data/mappers/exercise'
import { routineFromRow } from '@/data/mappers/routine'
import { WORKOUT_NESTED_SELECT, workoutFromRow } from '@/data/mappers/workout'
import { profileFromRow } from '@/data/mappers/profile'
import { requireUserId } from '@/data/repositories/session'

/** Everything the user owns, as a portable JSON document. */
export async function exportBackup(client: SupabaseClient<Database>): Promise<Backup> {
  const userId = await requireUserId(client)
  const [profile, exercises, routines, workouts] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).single(),
    client.from('exercises').select('*').eq('user_id', userId),
    client.from('routines').select('*, routine_exercises(*)'),
    client.from('workouts').select(WORKOUT_NESTED_SELECT).not('finished_at', 'is', null),
  ])
  for (const r of [profile, exercises, routines, workouts]) if (r.error) throw r.error

  const p = profileFromRow(profile.data!)
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: p.displayName,
      weightUnit: p.weightUnit,
      theme: p.theme,
      defaultRestSeconds: p.defaultRestSeconds,
      oneRepMaxFormula: p.oneRepMaxFormula,
      locale: p.locale,
    },
    exercises: exercises.data!.map(exerciseFromRow).map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscle: e.primaryMuscle,
      secondaryMuscles: e.secondaryMuscles,
      equipment: e.equipment,
      archivedAt: e.archivedAt,
    })),
    routines: routines.data!.map(routineFromRow).map((r) => ({
      name: r.name,
      notes: r.notes,
      exercises: r.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeightKg: e.targetWeightKg,
        restSeconds: e.restSeconds,
      })),
    })),
    workouts: workouts
      .data!.map(workoutFromRow)
      .filter((w): w is typeof w & { finishedAt: string } => w.finishedAt !== null)
      .map((w) => ({
        name: w.name,
        startedAt: w.startedAt,
        finishedAt: w.finishedAt,
        notes: w.notes,
        exercises: w.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          notes: e.notes,
          sets: e.sets.map((s) => ({
            reps: s.reps,
            weightKg: s.weightKg,
            rpe: s.rpe,
            type: s.type,
            completed: s.completed,
            durationSeconds: s.durationSeconds,
            distanceM: s.distanceM,
          })),
        })),
      })),
  }
}

export function parseBackup(json: string): Backup {
  return backupSchema.parse(JSON.parse(json))
}

export interface ImportResult {
  exercises: number
  routines: number
  workouts: number
}

/**
 * Adds the backup's data to the account. Custom exercises get new ids (the map is
 * used to rewire routines and workouts); global catalog ids are kept as-is.
 */
export async function importBackup(
  client: SupabaseClient<Database>,
  backup: Backup,
): Promise<ImportResult> {
  const userId = await requireUserId(client)
  const idMap = new Map<string, string>()

  if (backup.exercises.length > 0) {
    const { data, error } = await client
      .from('exercises')
      .insert(
        backup.exercises.map((e) => ({
          user_id: userId,
          name: e.name,
          primary_muscle: e.primaryMuscle,
          secondary_muscles: e.secondaryMuscles,
          equipment: e.equipment,
          archived_at: e.archivedAt,
        })),
      )
      .select('id')
    if (error) throw error
    backup.exercises.forEach((e, i) => idMap.set(e.id, data[i]!.id))
  }
  const mapId = (id: string) => idMap.get(id) ?? id

  for (const r of backup.routines) {
    const { data, error } = await client
      .from('routines')
      .insert({ name: r.name, notes: r.notes })
      .select('id')
      .single()
    if (error) throw error
    if (r.exercises.length > 0) {
      const { error: reError } = await client.from('routine_exercises').insert(
        r.exercises.map((e, position) => ({
          routine_id: data.id,
          exercise_id: mapId(e.exerciseId),
          position,
          target_sets: e.targetSets,
          target_reps: e.targetReps,
          target_weight_kg: e.targetWeightKg,
          rest_seconds: e.restSeconds,
        })),
      )
      if (reError) throw reError
    }
  }

  for (const w of backup.workouts) {
    const { data, error } = await client
      .from('workouts')
      .insert({ name: w.name, notes: w.notes, started_at: w.startedAt, finished_at: w.finishedAt })
      .select('id')
      .single()
    if (error) throw error
    for (const [position, e] of w.exercises.entries()) {
      const { data: we, error: weError } = await client
        .from('workout_exercises')
        .insert({ workout_id: data.id, exercise_id: mapId(e.exerciseId), position, notes: e.notes })
        .select('id')
        .single()
      if (weError) throw weError
      if (e.sets.length > 0) {
        const { error: setError } = await client.from('workout_sets').insert(
          e.sets.map((s, i) => ({
            workout_exercise_id: we.id,
            position: i,
            reps: s.reps,
            weight_kg: s.weightKg,
            rpe: s.rpe,
            set_type: s.type,
            completed: s.completed,
            duration_seconds: s.durationSeconds,
            distance_m: s.distanceM,
          })),
        )
        if (setError) throw setError
      }
    }
  }

  const { error } = await client
    .from('profiles')
    .update({
      display_name: backup.profile.displayName,
      weight_unit: backup.profile.weightUnit,
      theme: backup.profile.theme,
      default_rest_seconds: backup.profile.defaultRestSeconds,
      one_rep_max_formula: backup.profile.oneRepMaxFormula,
      locale: backup.profile.locale,
    })
    .eq('id', userId)
  if (error) throw error

  return {
    exercises: backup.exercises.length,
    routines: backup.routines.length,
    workouts: backup.workouts.length,
  }
}
