<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartOptions, TooltipItem } from 'chart.js'
import { baseOptions, isDark, seriesColor } from './chartTheme'

export interface LineSeries {
  label: string
  values: (number | null)[]
}

const props = defineProps<{
  labels: string[]
  /** Single series shorthand. */
  values?: number[]
  /** Up to two named series; a legend is rendered when more than one. */
  series?: LineSeries[]
  format?: (value: number) => string
  title: string
}>()

// Validated categorical palette, slots 1 and 2, stepped per surface.
const SECOND_LIGHT = '#eb6834'
const SECOND_DARK = '#d95926'

const allSeries = computed<LineSeries[]>(() =>
  props.series?.length ? props.series : [{ label: props.title, values: props.values ?? [] }],
)

const data = computed(() => {
  const colors = [seriesColor(), isDark() ? SECOND_DARK : SECOND_LIGHT]
  return {
    labels: props.labels,
    datasets: allSeries.value.map((s, i) => ({
      label: s.label,
      data: s.values,
      borderColor: colors[i] ?? colors[0],
      backgroundColor: colors[i] ?? colors[0],
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointBorderColor: 'var(--card)',
      tension: 0.2,
      fill: false,
      spanGaps: true,
    })),
  }
})

const options = computed<ChartOptions<'line'>>(() => {
  const base = baseOptions()
  const fmt = props.format ?? ((v: number) => String(v))
  return {
    ...base,
    plugins: {
      ...base.plugins,
      legend: {
        display: allSeries.value.length > 1,
        position: 'bottom',
        labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true },
      },
      tooltip: {
        ...base.plugins.tooltip,
        displayColors: allSeries.value.length > 1,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${allSeries.value.length > 1 ? `${ctx.dataset.label}: ` : ''}${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      ...base.scales,
      y: {
        ...base.scales.y,
        beginAtZero: false,
        ticks: { ...base.scales.y.ticks, callback: (v: string | number) => fmt(Number(v)) },
      },
    },
  }
})
</script>

<template>
  <figure class="h-48 w-full" role="img" :aria-label="title">
    <Line :data="data" :options="options" />
  </figure>
</template>
