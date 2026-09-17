export interface TrendPoint {
  /** ISO timestamp of the observation. */
  date: string
  value: number
}

export interface Trend {
  /** Change of `value` per day from a least-squares fit; 0 with fewer than 2 points. */
  slopePerDay: number
  /** Change per week, for display. */
  slopePerWeek: number
}

/** Least-squares slope over time. Robust to a single point or identical dates. */
export function linearTrend(points: TrendPoint[]): Trend {
  if (points.length < 2) return { slopePerDay: 0, slopePerWeek: 0 }
  const xs = points.map((p) => Date.parse(p.date) / 86_400_000)
  const ys = points.map((p) => p.value)
  const count = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / count
  const meanY = ys.reduce((a, b) => a + b, 0) / count
  let num = 0
  let den = 0
  for (let i = 0; i < count; i++) {
    const dx = (xs[i] ?? 0) - meanX
    num += dx * ((ys[i] ?? 0) - meanY)
    den += dx * dx
  }
  const slopePerDay = den === 0 ? 0 : num / den
  return { slopePerDay, slopePerWeek: slopePerDay * 7 }
}

/** Percent change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}
