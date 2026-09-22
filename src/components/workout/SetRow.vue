<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Trash2 } from '@lucide/vue'
import { SET_TYPES, type SetType, type WeightUnit, type WorkoutSet } from '@/domain/models'
import { displayWeight, formatWeight, inputToKg } from '@/domain/units/weight'
import { cn } from '@/lib/utils'
import { SET_GRID } from './grid'
import { motion, popIn, DURATION, EASE } from '@/lib/motion'

const props = defineProps<{
  set: WorkoutSet
  index: number
  unit: WeightUnit
  previous?: WorkoutSet
}>()

const emit = defineEmits<{
  update: [changes: { reps?: number; weightKg?: number; type?: SetType; rpe?: number | null }]
  toggle: []
  remove: []
}>()

const { t } = useI18n()

const TYPE_LABEL: Record<SetType, string> = { normal: '', warmup: 'W', drop: 'D', failure: 'F' }
const typeTitle = computed(() => t(`setType.${props.set.type}`))
const n = computed(() => props.index + 1)

const row = ref<HTMLElement | null>(null)

// A completed set pops and draws its check; undoing is silent.
watch(
  () => props.set.completed,
  (done, was) => {
    if (!row.value || done === was) return
    if (!done) return
    popIn(row.value)
    const path = row.value.querySelector('[data-check] svg > *')
    if (path)
      motion(path, {
        opacity: [0.2, 1],
        scale: [0.6, 1],
        duration: DURATION.base,
        ease: EASE.spring,
      })
  },
)

const weightValue = computed(() => displayWeight(props.set.weightKg, props.unit))
const previousLabel = computed(() =>
  props.previous
    ? `${formatWeight(props.previous.weightKg, props.unit)} × ${props.previous.reps}`
    : '—',
)

function cycleType() {
  const next = SET_TYPES[(SET_TYPES.indexOf(props.set.type) + 1) % SET_TYPES.length]!
  emit('update', { type: next })
}

function onWeight(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (raw === '' || !Number.isFinite(n) || n < 0) return
  emit('update', { weightKg: inputToKg(n, props.unit) })
}

function onRpe(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') {
    emit('update', { rpe: null })
    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1 || n > 10) return
  emit('update', { rpe: Math.round(n * 2) / 2 })
}

function onReps(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (raw === '' || !Number.isInteger(n) || n < 0) return
  emit('update', { reps: n })
}
</script>

<template>
  <div
    :class="
      cn('grid items-center gap-2 rounded-lg px-1 py-1', SET_GRID, set.completed && 'bg-primary/10')
    "
    ref="row"
    :data-testid="`set-row-${index}`"
  >
    <button
      type="button"
      class="min-h-11 rounded-md text-sm font-medium text-muted-foreground"
      :title="typeTitle"
      :aria-label="t('workout.set.typeLabel', { n, type: typeTitle })"
      @click="cycleType"
    >
      {{ TYPE_LABEL[set.type] || n }}
    </button>

    <span
      class="truncate text-xs text-muted-foreground"
      :title="t('workout.set.previous', { value: previousLabel })"
    >
      {{ previousLabel }}
    </span>

    <input
      type="number"
      inputmode="decimal"
      min="0"
      step="0.5"
      :value="weightValue"
      :aria-label="t('workout.set.weight', { n, unit })"
      class="h-11 w-full rounded-md border bg-background px-2 text-center text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @change="onWeight"
    />

    <input
      type="number"
      inputmode="numeric"
      min="0"
      step="1"
      :value="set.reps"
      :aria-label="t('workout.set.reps', { n })"
      class="h-11 w-full rounded-md border bg-background px-2 text-center text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @change="onReps"
    />

    <input
      type="number"
      inputmode="decimal"
      min="1"
      max="10"
      step="0.5"
      :value="set.rpe ?? ''"
      :aria-label="t('workout.rpeLabel', { n })"
      placeholder="–"
      class="h-11 w-full rounded-md border bg-background px-1 text-center text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @change="onRpe"
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
      data-check
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
