<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Trash2 } from '@lucide/vue'
import type { WorkoutSet } from '@/domain/models'
import { cn } from '@/lib/utils'

const props = defineProps<{ set: WorkoutSet; index: number; previous?: WorkoutSet }>()
const emit = defineEmits<{
  update: [changes: { durationSeconds?: number | null; distanceM?: number | null }]
  toggle: []
  remove: []
}>()

const { t } = useI18n()
const n = computed(() => props.index + 1)

const minutes = computed(() =>
  props.set.durationSeconds === null ? '' : Math.round(props.set.durationSeconds / 60),
)
const km = computed(() =>
  props.set.distanceM === null ? '' : Math.round(props.set.distanceM / 10) / 100,
)
const previousLabel = computed(() => {
  const p = props.previous
  if (!p) return '—'
  const parts: string[] = []
  if (p.durationSeconds) parts.push(`${Math.round(p.durationSeconds / 60)} min`)
  if (p.distanceM) parts.push(`${Math.round(p.distanceM / 10) / 100} km`)
  return parts.join(' · ') || '—'
})

function onMinutes(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const v = Number(raw)
  if (raw === '' || !Number.isFinite(v) || v < 0) return
  emit('update', { durationSeconds: Math.round(v * 60) })
}

function onKm(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const v = Number(raw)
  if (raw === '' || !Number.isFinite(v) || v < 0) return
  emit('update', { distanceM: Math.round(v * 1000) })
}

const inputClass =
  'h-11 w-full rounded-md border bg-background px-2 text-center text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
</script>

<template>
  <div
    :class="
      cn(
        'grid grid-cols-[2rem_1fr_4.5rem_4rem_2.75rem_2.5rem] items-center gap-2 rounded-lg px-1 py-1',
        set.completed && 'bg-primary/10',
      )
    "
    :data-testid="`set-row-${index}`"
  >
    <span class="text-center text-sm font-medium text-muted-foreground">{{ n }}</span>
    <span class="truncate text-xs text-muted-foreground">{{ previousLabel }}</span>
    <input
      type="number"
      inputmode="numeric"
      min="0"
      step="1"
      :value="minutes"
      :aria-label="t('cardio.durationLabel', { n })"
      :class="inputClass"
      @change="onMinutes"
    />
    <input
      type="number"
      inputmode="decimal"
      min="0"
      step="0.1"
      :value="km"
      :aria-label="t('cardio.distanceLabel', { n })"
      :class="inputClass"
      @change="onKm"
    />
    <button
      type="button"
      :class="
        cn(
          'flex size-11 items-center justify-center rounded-md border transition-colors',
          set.completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent',
        )
      "
      :aria-pressed="set.completed"
      :aria-label="
        set.completed ? t('workout.set.uncomplete', { n }) : t('workout.set.complete', { n })
      "
      @click="emit('toggle')"
    >
      <Check class="size-5" />
    </button>
    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
      :aria-label="t('workout.set.remove', { n })"
      @click="emit('remove')"
    >
      <Trash2 class="size-4" />
    </button>
  </div>
</template>
