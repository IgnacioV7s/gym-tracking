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

/** Total cardio time and distance from completed sets of cardio exercises. */
export function cardioTotals(
  workouts: Pick<Workout, 'exercises'>[],
  isCardio: (exerciseId: string) => boolean,
): { seconds: number; meters: number } {
  let seconds = 0
  let meters = 0
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (!isCardio(e.exerciseId)) continue
      for (const s of e.sets) {
        if (!s.completed) continue
        seconds += s.durationSeconds ?? 0
        meters += s.distanceM ?? 0
      }
    }
  }
  return { seconds, meters }
}
