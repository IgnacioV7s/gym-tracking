<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartOptions, TooltipItem } from 'chart.js'
import { baseOptions, seriesColor } from './chartTheme'

const props = defineProps<{
  labels: string[]
  values: number[]
  format?: (value: number) => string
  title: string
}>()

const data = computed(() => {
  const color = seriesColor()
  return {
    labels: props.labels,
    datasets: [
      {
        data: props.values,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderWidth: 2,
        pointBorderColor: 'var(--card)',
        tension: 0.2,
        fill: false,
      },
    ],
  }
})

const options = computed<ChartOptions<'line'>>(() => {
  const base = baseOptions()
  const fmt = props.format ?? ((v: number) => String(v))
  return {
    ...base,
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: { label: (ctx: TooltipItem<'line'>) => fmt(ctx.parsed.y ?? 0) },
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
