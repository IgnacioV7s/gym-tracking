import { describe, it, expect } from 'vitest'
import { computeStreak, dayKey, dayKinds } from './streak'

const today = new Date(2026, 8, 18, 15, 0) // Fri 18 Sep 2026, local

function streak(trained: string[], rest: string[] = [], now = today) {
  return computeStreak({ trainedDays: trained, restDays: rest, today: now })
}

describe('computeStreak', () => {
  it('is zero with no activity', () => {
    expect(streak([])).toEqual({ current: 0, best: 0, atRisk: false, today: null })
  })

  it('counts consecutive trained days ending today', () => {
    const s = streak(['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'])
    expect(s.current).toBe(4)
    expect(s.best).toBe(4)
    expect(s.atRisk).toBe(false)
    expect(s.today).toBe('trained')
  })

  it('keeps the streak alive (at risk) when today has nothing yet', () => {
    const s = streak(['2026-09-16', '2026-09-17'])
    expect(s.current).toBe(2)
    expect(s.atRisk).toBe(true)
    expect(s.today).toBeNull()
  })

  it('breaks after a missed day', () => {
    const s = streak(['2026-09-14', '2026-09-15', '2026-09-17'])
    expect(s.current).toBe(1)
    expect(s.best).toBe(2)
  })

  it('rest days keep the streak, up to two in a row', () => {
    expect(streak(['2026-09-15', '2026-09-18'], ['2026-09-16', '2026-09-17']).current).toBe(4)
    // Three rest days in a row break it.
    expect(
      streak(['2026-09-14', '2026-09-18'], ['2026-09-15', '2026-09-16', '2026-09-17']).current,
    ).toBe(1)
  })

  it('a marked rest day today extends the streak and is not at risk', () => {
    const s = streak(['2026-09-17'], ['2026-09-18'])
    expect(s).toMatchObject({ current: 2, atRisk: false, today: 'rest' })
  })

  it('rest days alone never form a streak', () => {
    expect(streak([], ['2026-09-17', '2026-09-18'])).toMatchObject({ current: 0, best: 0 })
  })

  it('training on a day also marked as rest counts as trained', () => {
    expect(streak(['2026-09-18'], ['2026-09-18']).today).toBe('trained')
  })

  it('tracks the best streak from the past', () => {
    const s = streak([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-09-18',
    ])
    expect(s.current).toBe(1)
    expect(s.best).toBe(5)
  })

  it('uses local calendar days', () => {
    expect(dayKey(new Date(2026, 8, 18, 23, 59))).toBe('2026-09-18')
    expect(dayKey(new Date(2026, 8, 18, 0, 1))).toBe('2026-09-18')
  })
})

describe('dayKinds', () => {
  it('maps days in range to trained or rest, training winning', () => {
    const kinds = dayKinds(
      ['2026-09-16'],
      ['2026-09-16', '2026-09-17'],
      new Date(2026, 8, 15),
      new Date(2026, 8, 18),
    )
    expect([...kinds.entries()]).toEqual([
      ['2026-09-16', 'trained'],
      ['2026-09-17', 'rest'],
    ])
  })
})
