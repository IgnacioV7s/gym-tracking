import type { Workout, WorkoutSet } from '@/domain/models'

/** Sets that count toward volume: completed and not warm-ups. */
export function isWorkingSet(set: WorkoutSet): boolean {
  return set.completed && set.type !== 'warmup'
}

export function setVolumeKg(set: WorkoutSet): number {
  return set.reps * set.weightKg
}

export function workoutVolumeKg(workout: Pick<Workout, 'exercises'>): number {
  return workout.exercises.reduce(
    (total, e) => total + e.sets.filter(isWorkingSet).reduce((t, s) => t + setVolumeKg(s), 0),
    0,
  )
}

export function workoutWorkingSets(workout: Pick<Workout, 'exercises'>): number {
  return workout.exercises.reduce((n, e) => n + e.sets.filter(isWorkingSet).length, 0)
}

/** Duration in whole minutes; 0 while in progress or if timestamps are inconsistent. */
export function workoutDurationMinutes(workout: Pick<Workout, 'startedAt' | 'finishedAt'>): number {
  if (!workout.finishedAt) return 0
  const ms = Date.parse(workout.finishedAt) - Date.parse(workout.startedAt)
  return ms > 0 ? Math.round(ms / 60_000) : 0
}
