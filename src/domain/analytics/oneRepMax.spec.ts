import { describe, it, expect } from 'vitest'
import type { WorkoutSet } from '@/domain/models'
import { bestOneRepMax, estimateOneRepMax } from './oneRepMax'

describe('estimateOneRepMax', () => {
  it('uses epley by default', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2)
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2)
  })

  it('uses brzycki when requested and clamps reps at 36', () => {
    expect(estimateOneRepMax(100, 5, 'brzycki')).toBeCloseTo(112.5, 2)
    expect(estimateOneRepMax(100, 40, 'brzycki')).toBe(estimateOneRepMax(100, 36, 'brzycki'))
    expect(Number.isFinite(estimateOneRepMax(100, 37, 'brzycki'))).toBe(true)
  })

  it('handles edge cases', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
    expect(estimateOneRepMax(100, 0)).toBe(0)
    expect(estimateOneRepMax(0, 10)).toBe(0)
  })
})

describe('bestOneRepMax', () => {
  const set = (o: Partial<WorkoutSet>): WorkoutSet => ({
    id: 's',
    position: 0,
    reps: 5,
    weightKg: 100,
    rpe: null,
    type: 'normal',
    completed: true,
    durationSeconds: null,
    distanceM: null,
    ...o,
  })

  it('ignores warmups and incomplete sets', () => {
    expect(
      bestOneRepMax([
        set({ weightKg: 200, type: 'warmup' }),
        set({ weightKg: 150, completed: false }),
        set({ weightKg: 100, reps: 5 }),
        set({ weightKg: 90, reps: 10 }),
      ]),
    ).toBeCloseTo(120, 2)
  })

  it('is zero without sets', () => {
    expect(bestOneRepMax([])).toBe(0)
  })
})
