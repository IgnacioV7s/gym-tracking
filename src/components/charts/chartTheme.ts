import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
)

/** Validated single-series hue (dataviz palette slot 1), stepped per surface. */
export const SERIES_LIGHT = '#2a78d6'
export const SERIES_DARK = '#3987e5'

export function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

export function seriesColor(): string {
  return isDark() ? SERIES_DARK : SERIES_LIGHT
}

function cssVar(name: string, fallback: string): string {
  if (typeof getComputedStyle === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** Recessive axes/grid using the app's muted tokens; text never wears the series color. */
export function baseOptions() {
  const text = cssVar('--muted-foreground', '#6b7280')
  const grid = cssVar('--border', '#e5e7eb')
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        padding: 8,
        titleFont: { weight: 'normal' as const },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: grid },
        ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
      },
      y: {
        beginAtZero: true,
        grid: { color: grid, drawTicks: false },
        border: { display: false },
        ticks: { color: text, maxTicksLimit: 5, padding: 6 },
      },
    },
  }
}
