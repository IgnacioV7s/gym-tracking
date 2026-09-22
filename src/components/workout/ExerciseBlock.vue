<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2, ChevronUp, ChevronDown, NotebookPen, TrendingUp } from '@lucide/vue'
import { suggestProgression } from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { Textarea } from '@/components/ui/textarea'
import { CARDIO_GRID, SET_GRID } from './grid'
import type { SetType, WeightUnit, WorkoutExercise, WorkoutSet } from '@/domain/models'
import { Button } from '@/components/ui/button'
import SetRow from './SetRow.vue'
import CardioSetRow from './CardioSetRow.vue'

const props = defineProps<{
  exercise: WorkoutExercise
  name: string
  unit: WeightUnit
  cardio?: boolean
  isFirst?: boolean
  isLast?: boolean
  previousSet: (position: number) => WorkoutSet | undefined
  previousSets?: WorkoutSet[]
  targetReps?: number
}>()

const emit = defineEmits<{
  addSet: []
  removeExercise: []
  updateSet: [
    setId: string,
    changes: {
      reps?: number
      weightKg?: number
      type?: SetType
      rpe?: number | null
      durationSeconds?: number | null
      distanceM?: number | null
    },
  ]
  updateNotes: [notes: string | null]
  move: [delta: -1 | 1]
  applySuggestion: [changes: { weightKg: number; reps: number }]
  toggleSet: [setId: string]
  removeSet: [setId: string]
}>()

const { t } = useI18n()
const showNotes = ref(false)

const suggestion = computed(() => {
  if (props.cardio || !props.previousSets?.length) return null
  const target = props.targetReps ?? Math.max(...props.previousSets.map((s) => s.reps), 1)
  return suggestProgression(props.previousSets, target, props.unit)
})
const hasPending = computed(() => props.exercise.sets.some((s) => !s.completed))
</script>

<template>
  <section class="rounded-xl border bg-card p-3" :aria-label="name">
    <header class="mb-2 flex items-center gap-2">
      <h2 class="flex-1 truncate font-semibold">{{ name }}</h2>
      <Button
        variant="ghost"
        size="icon"
        :disabled="isFirst"
        :aria-label="t('workout.moveUp', { name })"
        @click="emit('move', -1)"
      >
        <ChevronUp class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :disabled="isLast"
        :aria-label="t('workout.moveDown', { name })"
        @click="emit('move', 1)"
      >
        <ChevronDown class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('workout.notes')"
        :aria-pressed="showNotes || !!exercise.notes"
        :class="exercise.notes && 'text-primary'"
        @click="showNotes = !showNotes"
      >
        <NotebookPen class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('workout.removeExercise', { name })"
        @click="emit('removeExercise')"
      >
        <Trash2 class="size-4" />
      </Button>
    </header>

    <button
      v-if="suggestion && hasPending"
      type="button"
      class="mb-2 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-accent"
      :class="suggestion.increase ? 'border-green-600/40 bg-green-600/10' : 'border-border'"
      :title="t('workout.applySuggestion')"
      @click="emit('applySuggestion', { weightKg: suggestion.weightKg, reps: suggestion.reps })"
    >
      <TrendingUp
        class="size-4 shrink-0"
        :class="suggestion.increase && 'text-green-600'"
        aria-hidden="true"
      />
      <span class="flex-1">
        {{
          t(suggestion.increase ? 'workout.suggestionUp' : 'workout.suggestion', {
            weight: formatWeight(suggestion.weightKg, unit),
            reps: suggestion.reps,
          })
        }}
      </span>
      <span class="text-muted-foreground">{{ t('workout.applySuggestion') }}</span>
    </button>

    <Textarea
      v-if="showNotes || exercise.notes"
      :model-value="exercise.notes ?? ''"
      :placeholder="t('workout.notesPlaceholder')"
      :aria-label="t('workout.notes')"
      rows="2"
      maxlength="500"
      class="mb-2"
      @input="emit('updateNotes', ($event.target as HTMLTextAreaElement).value || null)"
    />

    <div
      class="mb-1 grid gap-2 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
      :class="cardio ? CARDIO_GRID : SET_GRID"
      aria-hidden="true"
    >
      <span>#</span>
      <span class="truncate">{{ t('workout.columns.previous') }}</span>
      <span class="truncate text-center">{{ cardio ? t('cardio.minutes') : unit }}</span>
      <span class="truncate text-center">
        {{ cardio ? t('cardio.distance') : t('workout.columns.reps') }}
      </span>
      <span v-if="!cardio" class="truncate text-center">{{ t('workout.rpe') }}</span>
      <span />
      <span />
    </div>

    <div class="grid gap-1">
      <template v-for="(set, i) in exercise.sets" :key="set.id">
        <CardioSetRow
          v-if="cardio"
          :set="set"
          :index="i"
          :previous="previousSet(i)"
          @update="emit('updateSet', set.id, $event)"
          @toggle="emit('toggleSet', set.id)"
          @remove="emit('removeSet', set.id)"
        />
        <SetRow
          v-else
          :set="set"
          :index="i"
          :unit="unit"
          :previous="previousSet(i)"
          @update="emit('updateSet', set.id, $event)"
          @toggle="emit('toggleSet', set.id)"
          @remove="emit('removeSet', set.id)"
        />
      </template>
    </div>

    <Button variant="secondary" class="mt-2 w-full" @click="emit('addSet')">
      <Plus class="size-4" />
      {{ t('workout.addSet') }}
    </Button>
  </section>
</template>
