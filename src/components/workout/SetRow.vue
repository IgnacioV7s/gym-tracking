<script setup lang="ts">
import { computed } from 'vue'
import { Check, Trash2 } from '@lucide/vue'
import { SET_TYPES, type SetType, type WeightUnit, type WorkoutSet } from '@/domain/models'
import { displayWeight, formatWeight, inputToKg } from '@/domain/units/weight'
import { cn } from '@/lib/utils'

const props = defineProps<{
  set: WorkoutSet
  index: number
  unit: WeightUnit
  previous?: WorkoutSet
}>()

const emit = defineEmits<{
  update: [changes: { reps?: number; weightKg?: number; type?: SetType }]
  toggle: []
  remove: []
}>()

const TYPE_LABEL: Record<SetType, string> = { normal: '', warmup: 'C', drop: 'D', failure: 'F' }
const TYPE_TITLE: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Calentamiento',
  drop: 'Drop set',
  failure: 'Al fallo',
}

const weightValue = computed(() => displayWeight(props.set.weightKg, props.unit))
const previousLabel = computed(() =>
  props.previous ? `${formatWeight(props.previous.weightKg, props.unit)} × ${props.previous.reps}` : '—',
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
      cn(
        'grid grid-cols-[2rem_1fr_4.5rem_4rem_2.75rem_2.5rem] items-center gap-2 rounded-lg px-1 py-1',
        set.completed && 'bg-primary/10',
      )
    "
    :data-testid="`set-row-${index}`"
  >
    <button
      type="button"
      class="min-h-11 rounded-md text-sm font-medium text-muted-foreground"
      :title="TYPE_TITLE[set.type]"
      :aria-label="`Serie ${index + 1}, tipo ${TYPE_TITLE[set.type]}. Cambiar tipo`"
      @click="cycleType"
    >
      {{ TYPE_LABEL[set.type] || index + 1 }}
    </button>

    <span class="truncate text-xs text-muted-foreground" :title="`Anterior: ${previousLabel}`">
      {{ previousLabel }}
    </span>

    <input
      type="number"
      inputmode="decimal"
      min="0"
      step="0.5"
      :value="weightValue"
      :aria-label="`Peso serie ${index + 1} (${unit})`"
      class="h-11 w-full rounded-md border bg-background px-2 text-center text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @change="onWeight"
    />

    <input
      type="number"
      inputmode="numeric"
      min="0"
      step="1"
      :value="set.reps"
      :aria-label="`Repeticiones serie ${index + 1}`"
      class="h-11 w-full rounded-md border bg-background px-2 text-center text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @change="onReps"
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
      :aria-label="`${set.completed ? 'Desmarcar' : 'Completar'} serie ${index + 1}`"
      @click="emit('toggle')"
    >
      <Check class="size-5" />
    </button>

    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
      :aria-label="`Eliminar serie ${index + 1}`"
      @click="emit('remove')"
    >
      <Trash2 class="size-4" />
    </button>
  </div>
</template>
