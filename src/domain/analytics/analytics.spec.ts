import { describe, it, expect } from 'vitest'
import type { Workout, WorkoutSet } from '@/domain/models'
import { newRecordsIn, personalRecords } from './personalRecords'
import { setsByMuscle, weeklyBuckets } from './frequency'
import { linearTrend, percentChange } from './trends'

let seq = 0
function set(weightKg: number, reps: number, overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  seq += 1
  return {
    id: `s${seq}`,
    position: 0,
    reps,
    weightKg,
    rpe: null,
    type: 'normal',
    completed: true,
    durationSeconds: null,
    distanceM: null,
    ...overrides,
  }
}

function workout(id: string, startedAt: string, exercises: Record<string, WorkoutSet[]>): Workout {
  return {
    id,
    routineId: null,
    name: id,
    startedAt,
    finishedAt: startedAt,
    notes: null,
    exercises: Object.entries(exercises).map(([exerciseId, sets], position) => ({
      id: `${id}-${exerciseId}`,
      exerciseId,
      position,
      notes: null,
      sets,
    })),
  }
}

const w1 = workout('w1', '2026-09-01T10:00:00Z', {
  bench: [set(80, 8), set(60, 12, { type: 'warmup' })],
})
const w2 = workout('w2', '2026-09-08T10:00:00Z', {
  bench: [set(85, 5), set(80, 8, { completed: false })],
  squat: [set(100, 5)],
})

describe('personalRecords', () => {
  it('tracks best weight and best 1rm per exercise ignoring warmups and incomplete sets', () => {
    const recs = personalRecords([w1, w2])
    expect(recs.get('bench')?.bestWeight).toMatchObject({ weightKg: 85, reps: 5, workoutId: 'w2' })
    expect(recs.get('bench')?.bestOneRepMax?.valueKg).toBeCloseTo(80 * (1 + 8 / 30), 2)
    expect(recs.get('squat')?.bestWeight?.weightKg).toBe(100)
  })

  it('detects new 1rm records set in a workout', () => {
    const w3 = workout('w3', '2026-09-15T10:00:00Z', { bench: [set(90, 6)], squat: [set(90, 5)] })
    expect(newRecordsIn(w3, [w1, w2, w3])).toEqual(['bench'])
  })

  it('skips unfinished workouts', () => {
    expect(personalRecords([{ ...w1, finishedAt: null }]).size).toBe(0)
  })
})

describe('weeklyBuckets', () => {
  it('groups by monday-based week with volume and sets', () => {
    const buckets = weeklyBuckets([w2, w1])
    expect(buckets.map((b) => b.weekStart)).toEqual(['2026-08-31', '2026-09-07'])
    expect(buckets[0]).toMatchObject({ sessions: 1, sets: 1, volumeKg: 640 })
    expect(buckets[1]).toMatchObject({ sessions: 1, sets: 2, volumeKg: 85 * 5 + 100 * 5 })
  })

  it('is empty without workouts', () => {
    expect(weeklyBuckets([])).toEqual([])
  })
})

describe('setsByMuscle', () => {
  it('counts working sets by primary muscle', () => {
    const map = setsByMuscle(
      [w1, w2],
      new Map([
        ['bench', { primaryMuscle: 'chest' as const }],
        ['squat', { primaryMuscle: 'quads' as const }],
      ]),
    )
    expect(map.get('chest')).toBe(2)
    expect(map.get('quads')).toBe(1)
  })
})

describe('trends', () => {
  it('fits a slope per day and per week', () => {
    const t = linearTrend([
      { date: '2026-09-01T00:00:00Z', value: 100 },
      { date: '2026-09-08T00:00:00Z', value: 107 },
      { date: '2026-09-15T00:00:00Z', value: 114 },
    ])
    expect(t.slopePerDay).toBeCloseTo(1, 6)
    expect(t.slopePerWeek).toBeCloseTo(7, 6)
  })

  it('is flat with one point or identical dates', () => {
    expect(linearTrend([{ date: '2026-09-01T00:00:00Z', value: 5 }]).slopePerDay).toBe(0)
    expect(
      linearTrend([
        { date: '2026-09-01T00:00:00Z', value: 5 },
        { date: '2026-09-01T00:00:00Z', value: 9 },
      ]).slopePerDay,
    ).toBe(0)
  })

  it('percentChange handles a zero baseline', () => {
    expect(percentChange(120, 100)).toBe(20)
    expect(percentChange(5, 0)).toBeNull()
  })
})
