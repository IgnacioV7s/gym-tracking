import type { WeightUnit, WorkoutSet } from '@/domain/models'
import { isWorkingSet } from './volume'

export interface Suggestion {
  weightKg: number
  reps: number
  /** True when the weight went up versus last time. */
  increase: boolean
}

/** Smallest practical plate jump per unit, in kg. */
export const STEP_KG: Record<WeightUnit, number> = { kg: 2.5, lb: 5 / 2.2046226218 }

/**
 * Double progression: once every working set of the last session hits the
 * target reps at the same weight, add one step; otherwise keep the weight and
 * aim for one more rep on the weakest set.
 */
export function suggestProgression(
  previous: WorkoutSet[],
  targetReps: number,
  unit: WeightUnit = 'kg',
): Suggestion | null {
  const working = previous.filter(isWorkingSet)
  if (working.length === 0) return null
  const weights = new Set(working.map((s) => s.weightKg))
  const weightKg = Math.max(...weights)
  const minReps = Math.min(...working.map((s) => s.reps))
  if (weights.size === 1 && minReps >= targetReps && weightKg > 0) {
    const next = Math.round((weightKg + STEP_KG[unit]) * 100) / 100
    return { weightKg: next, reps: targetReps, increase: true }
  }
  return { weightKg, reps: Math.min(minReps + 1, targetReps), increase: false }
}
