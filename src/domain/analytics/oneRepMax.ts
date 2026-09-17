import type { OneRepMaxFormula, WorkoutSet } from '@/domain/models'

/**
 * Estimated one-rep max. Returns the lifted weight for 1 rep and 0 for 0 reps.
 * Brzycki is undefined at 37+ reps; we clamp reps to 36 to keep it finite.
 */
export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  formula: OneRepMaxFormula = 'epley',
): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  if (formula === 'brzycki') return (weightKg * 36) / (37 - Math.min(reps, 36))
  return weightKg * (1 + reps / 30)
}

/** Best estimated 1RM among completed non-warmup sets. */
export function bestOneRepMax(sets: WorkoutSet[], formula: OneRepMaxFormula = 'epley'): number {
  return sets.reduce((best, s) => {
    if (!s.completed || s.type === 'warmup') return best
    return Math.max(best, estimateOneRepMax(s.weightKg, s.reps, formula))
  }, 0)
}
