import type { OneRepMaxFormula, Workout, WorkoutSet } from '@/domain/models'
import { estimateOneRepMax } from './oneRepMax'
import { isWorkingSet } from './volume'

export interface RecordSet {
  weightKg: number
  reps: number
  workoutId: string
  date: string
}

export interface ExerciseRecord {
  exerciseId: string
  /** Heaviest completed set (by weight, then reps). */
  bestWeight: RecordSet | null
  /** Highest estimated 1RM. */
  bestOneRepMax: (RecordSet & { valueKg: number }) | null
}

function heavier(a: WorkoutSet, b: RecordSet | null): boolean {
  if (!b) return true
  return a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps)
}

/** All-time records per exercise across finished workouts. */
export function personalRecords(
  workouts: Workout[],
  formula: OneRepMaxFormula = 'epley',
): Map<string, ExerciseRecord> {
  const out = new Map<string, ExerciseRecord>()
  for (const w of workouts) {
    if (!w.finishedAt) continue
    for (const e of w.exercises) {
      const rec = out.get(e.exerciseId) ?? {
        exerciseId: e.exerciseId,
        bestWeight: null,
        bestOneRepMax: null,
      }
      for (const s of e.sets) {
        if (!isWorkingSet(s)) continue
        if (heavier(s, rec.bestWeight)) {
          rec.bestWeight = {
            weightKg: s.weightKg,
            reps: s.reps,
            workoutId: w.id,
            date: w.startedAt,
          }
        }
        const valueKg = estimateOneRepMax(s.weightKg, s.reps, formula)
        if (valueKg > (rec.bestOneRepMax?.valueKg ?? 0)) {
          rec.bestOneRepMax = {
            valueKg,
            weightKg: s.weightKg,
            reps: s.reps,
            workoutId: w.id,
            date: w.startedAt,
          }
        }
      }
      out.set(e.exerciseId, rec)
    }
  }
  return out
}

/** Exercise ids whose 1RM record was beaten inside `workout`, given the full `history`. */
export function newRecordsIn(
  workout: Workout,
  history: Workout[],
  formula: OneRepMaxFormula = 'epley',
): string[] {
  const before = personalRecords(
    history.filter((w) => w.id !== workout.id),
    formula,
  )
  const after = personalRecords([workout], formula)
  const ids: string[] = []
  for (const [exerciseId, rec] of after) {
    const prev = before.get(exerciseId)?.bestOneRepMax?.valueKg ?? 0
    if ((rec.bestOneRepMax?.valueKg ?? 0) > prev) ids.push(exerciseId)
  }
  return ids
}
