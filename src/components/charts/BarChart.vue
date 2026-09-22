<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartOptions, TooltipItem } from 'chart.js'
import { prefersReducedMotion } from '@/lib/motion'
import { baseOptions, seriesColor } from './chartTheme'

const props = defineProps<{
  labels: string[]
  values: number[]
  /** Formats a value for the tooltip and axis. */
  format?: (value: number) => string
  title: string
}>()

const data = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: seriesColor(),
      borderRadius: 4,
      borderSkipped: 'bottom' as const,
      maxBarThickness: 28,
      categoryPercentage: 0.7,
      barPercentage: 0.9,
    },
  ],
}))

const options = computed<ChartOptions<'bar'>>(() => {
  const base = baseOptions()
  const fmt = props.format ?? ((v: number) => String(v))
  return {
    ...base,
    animation: prefersReducedMotion() ? false : { duration: 600, easing: 'easeOutQuart' as const },
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: { label: (ctx: TooltipItem<'bar'>) => fmt(ctx.parsed.y ?? 0) },
      },
    },
    scales: {
      ...base.scales,
      y: {
        ...base.scales.y,
        ticks: { ...base.scales.y.ticks, callback: (v: string | number) => fmt(Number(v)) },
      },
    },
  }
})
</script>

<template>
  <figure class="h-48 w-full" role="img" :aria-label="title">
    <Bar :data="data" :options="options" />
  </figure>
</template>
