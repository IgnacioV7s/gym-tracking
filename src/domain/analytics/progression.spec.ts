import { describe, it, expect } from 'vitest'
import type { WorkoutSet } from '@/domain/models'
import { suggestProgression } from './progression'

const set = (weightKg: number, reps: number, o: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 's',
  position: 0,
  reps,
  weightKg,
  rpe: null,
  type: 'normal',
  completed: true,
  durationSeconds: null,
  distanceM: null,
  ...o,
})

describe('suggestProgression', () => {
  it('adds a step when every set hit the target at one weight', () => {
    expect(suggestProgression([set(80, 8), set(80, 8), set(80, 9)], 8)).toEqual({
      weightKg: 82.5,
      reps: 8,
      increase: true,
    })
    expect(suggestProgression([set(80, 8)], 8, 'lb')?.weightKg).toBeCloseTo(82.27, 2)
  })

  it('keeps the weight and asks for one more rep otherwise', () => {
    expect(suggestProgression([set(80, 8), set(80, 6)], 8)).toEqual({
      weightKg: 80,
      reps: 7,
      increase: false,
    })
  })

  it('ignores warmups and incomplete sets; null without data', () => {
    expect(
      suggestProgression([set(60, 10, { type: 'warmup' }), set(80, 8, { completed: false })], 8),
    ).toBeNull()
    expect(suggestProgression([], 8)).toBeNull()
  })

  it('does not increase bodyweight (0 kg) exercises', () => {
    expect(suggestProgression([set(0, 12)], 10)).toEqual({ weightKg: 0, reps: 10, increase: false })
  })
})
