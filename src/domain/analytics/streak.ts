import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns'

/** Local calendar day as yyyy-MM-dd. */
export function dayKey(date: Date | string): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd')
}

export type DayKind = 'trained' | 'rest'

export interface StreakInput {
  /** Days with at least one finished workout (yyyy-MM-dd, local). */
  trainedDays: Iterable<string>
  /** Days explicitly marked as rest (yyyy-MM-dd). */
  restDays: Iterable<string>
  today: Date
  /** Rest days in a row that still keep the streak alive. */
  maxConsecutiveRest?: number
}

export interface Streak {
  /** Consecutive active days ending today or yesterday. */
  current: number
  /** Longest streak ever. */
  best: number
  /** True when the streak counts up to yesterday but today has no activity yet. */
  atRisk: boolean
  /** What today is, if anything. */
  today: DayKind | null
}

export const DEFAULT_MAX_CONSECUTIVE_REST = 2

/**
 * Builds a map of active days, then walks backwards from today. A rest day
 * counts only while fewer than `maxConsecutiveRest` rest days precede it in a
 * row; a trained day resets that counter.
 */
export function computeStreak({
  trainedDays,
  restDays,
  today,
  maxConsecutiveRest = DEFAULT_MAX_CONSECUTIVE_REST,
}: StreakInput): Streak {
  const kinds = new Map<string, DayKind>()
  for (const d of restDays) kinds.set(d, 'rest')
  for (const d of trainedDays) kinds.set(d, 'trained') // training wins over rest

  const todayKey = dayKey(today)
  const todayKind = kinds.get(todayKey) ?? null

  // Current streak: start from today if active, else from yesterday.
  let cursor = startOfDay(today)
  if (!todayKind) cursor = subDays(cursor, 1)
  const current = walk(kinds, cursor, maxConsecutiveRest)
  const atRisk = !todayKind && current > 0

  // Best streak: scan all active days chronologically with the same rule.
  const sorted = [...kinds.keys()].sort()
  let best = 0
  let run = 0
  let pendingRest = 0
  let prev: string | null = null
  for (const key of sorted) {
    const gap = prev
      ? differenceInCalendarDays(new Date(`${key}T00:00:00`), new Date(`${prev}T00:00:00`))
      : 1
    if (gap !== 1) {
      run = 0
      pendingRest = 0
    }
    if (kinds.get(key) === 'rest') {
      pendingRest += 1
      if (pendingRest > maxConsecutiveRest) {
        run = 0
        pendingRest = 0
      }
    } else {
      run += pendingRest + 1
      pendingRest = 0
      best = Math.max(best, run)
    }
    prev = key
  }

  return { current, best: Math.max(best, current), atRisk, today: todayKind }
}

/**
 * Walks backwards from `from`. Rest days are counted only once an earlier
 * trained day is reached, so rest alone never forms a streak; a marked rest
 * day today does extend an existing one.
 */
function walk(kinds: Map<string, DayKind>, from: Date, maxConsecutiveRest: number): number {
  let count = 0
  let pendingRest = 0
  let cursor = from
  for (;;) {
    const kind = kinds.get(dayKey(cursor))
    if (!kind) break
    if (kind === 'rest') {
      pendingRest += 1
      if (pendingRest > maxConsecutiveRest) break
    } else {
      count += pendingRest + 1
      pendingRest = 0
    }
    cursor = subDays(cursor, 1)
  }
  return count
}

/** Convenience for calendars: every day between two dates with its kind. */
export function dayKinds(
  trainedDays: Iterable<string>,
  restDays: Iterable<string>,
  from: Date,
  to: Date,
): Map<string, DayKind> {
  const trained = new Set(trainedDays)
  const rest = new Set(restDays)
  const out = new Map<string, DayKind>()
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) {
    const key = dayKey(d)
    if (trained.has(key)) out.set(key, 'trained')
    else if (rest.has(key)) out.set(key, 'rest')
  }
  return out
}
