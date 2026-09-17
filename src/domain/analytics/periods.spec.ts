import { describe, it, expect } from 'vitest'
import { isWithin, periodFor, previousPeriod, weekStartOf } from './periods'

const now = new Date(2026, 8, 17, 15, 0) // Thu 17 Sep 2026, local

describe('periodFor', () => {
  it('week starts on monday', () => {
    const p = periodFor('week', now)
    expect(p.from).toEqual(new Date(2026, 8, 14, 0, 0, 0, 0))
    expect(p.to.getDate()).toBe(20)
  })

  it('month covers the calendar month', () => {
    const p = periodFor('month', now)
    expect(p.from).toEqual(new Date(2026, 8, 1))
    expect(p.to.getDate()).toBe(30)
  })

  it('3 months and year end today', () => {
    expect(periodFor('3months', now).to.getDate()).toBe(17)
    expect(periodFor('3months', now).from).toEqual(new Date(2026, 5, 18))
    expect(periodFor('year', now).from).toEqual(new Date(2025, 8, 18))
  })

  it('offset shifts back whole periods', () => {
    expect(periodFor('month', now, 1).from).toEqual(new Date(2026, 7, 1))
  })
})

describe('previousPeriod', () => {
  it('returns the same-length window right before', () => {
    const prev = previousPeriod(periodFor('week', now))
    expect(prev.from).toEqual(new Date(2026, 8, 7))
    expect(prev.to.getDate()).toBe(13)
  })
})

describe('helpers', () => {
  it('isWithin is inclusive', () => {
    const p = periodFor('week', now)
    expect(isWithin(p.from.toISOString(), p)).toBe(true)
    expect(isWithin(p.to.toISOString(), p)).toBe(true)
    expect(isWithin(new Date(2026, 8, 21).toISOString(), p)).toBe(false)
  })

  it('weekStartOf is monday', () => {
    expect(weekStartOf(now.toISOString()).getDay()).toBe(1)
  })
})
