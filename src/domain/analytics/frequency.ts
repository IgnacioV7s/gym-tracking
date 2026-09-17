import { format } from 'date-fns'
import type { Exercise, MuscleGroup, Workout } from '@/domain/models'
import { isWorkingSet } from './volume'
import { weekStartOf } from './periods'

export interface WeeklyBucket {
  /** yyyy-MM-dd of the Monday starting the week. */
  weekStart: string
  sessions: number
  volumeKg: number
  sets: number
}

/** Sessions, volume and working sets per week, oldest first. Only finished workouts. */
export function weeklyBuckets(workouts: Workout[]): WeeklyBucket[] {
  const map = new Map<string, WeeklyBucket>()
  for (const w of workouts) {
    if (!w.finishedAt) continue
    const key = format(weekStartOf(w.startedAt), 'yyyy-MM-dd')
    const b = map.get(key) ?? { weekStart: key, sessions: 0, volumeKg: 0, sets: 0 }
    b.sessions += 1
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (!isWorkingSet(s)) continue
        b.sets += 1
        b.volumeKg += s.reps * s.weightKg
      }
    }
    map.set(key, b)
  }
  return [...map.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

/** Working sets per primary muscle group across finished workouts. */
export function setsByMuscle(
  workouts: Workout[],
  exercisesById: Map<string, Pick<Exercise, 'primaryMuscle'>>,
): Map<MuscleGroup, number> {
  const out = new Map<MuscleGroup, number>()
  for (const w of workouts) {
    if (!w.finishedAt) continue
    for (const e of w.exercises) {
      const muscle = exercisesById.get(e.exerciseId)?.primaryMuscle
      if (!muscle) continue
      const count = e.sets.filter(isWorkingSet).length
      if (count > 0) out.set(muscle, (out.get(muscle) ?? 0) + count)
    }
  }
  return out
}
