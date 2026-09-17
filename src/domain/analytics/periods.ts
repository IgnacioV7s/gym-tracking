import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'

export type PeriodPreset = 'week' | 'month' | '3months' | 'year' | 'custom'

export interface Period {
  /** Inclusive start (local time). */
  from: Date
  /** Inclusive end (local time). */
  to: Date
}

const WEEK_OPTS = { weekStartsOn: 1 as const }

/** Period ending today for a preset; `offset` shifts it back that many periods. */
export function periodFor(
  preset: Exclude<PeriodPreset, 'custom'>,
  now = new Date(),
  offset = 0,
): Period {
  switch (preset) {
    case 'week': {
      const ref = subWeeks(now, offset)
      return { from: startOfWeek(ref, WEEK_OPTS), to: endOfWeek(ref, WEEK_OPTS) }
    }
    case 'month': {
      const ref = subMonths(now, offset)
      return { from: startOfMonth(ref), to: endOfMonth(ref) }
    }
    case '3months': {
      const to = endOfDay(subMonths(now, 3 * offset))
      return { from: startOfDay(addMonths(subDays(to, -1), -3)), to }
    }
    case 'year': {
      const to = endOfDay(subYears(now, offset))
      return { from: startOfDay(addYears(subDays(to, -1), -1)), to }
    }
  }
}

/** The same-length period immediately before `period`. */
export function previousPeriod(period: Period): Period {
  const days = differenceInCalendarDays(period.to, period.from) + 1
  return { from: startOfDay(subDays(period.from, days)), to: endOfDay(subDays(period.from, 1)) }
}

export function isWithin(iso: string, period: Period): boolean {
  const t = Date.parse(iso)
  return t >= period.from.getTime() && t <= period.to.getTime()
}

/** Monday-based week start for grouping. */
export function weekStartOf(iso: string): Date {
  return startOfWeek(new Date(iso), WEEK_OPTS)
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1)
}
