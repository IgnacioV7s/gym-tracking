<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import type { WeightUnit, Workout } from '@/domain/models'
import { isWorkingSet } from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { dateFnsLocale } from '@/i18n'
import { useExerciseName } from '@/composables/useExerciseName'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import LineChart from '@/components/charts/LineChart.vue'

const props = defineProps<{ workouts: Workout[]; unit: WeightUnit }>()
const { t } = useI18n()
const { nameById } = useExerciseName()

const exerciseIds = computed(() => {
  const counts = new Map<string, number>()
  for (const w of props.workouts)
    for (const e of w.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
})

const a = ref('')
const b = ref('')
watch(
  exerciseIds,
  (ids) => {
    if (!ids.includes(a.value)) a.value = ids[0] ?? ''
    if (b.value && !ids.includes(b.value)) b.value = ''
  },
  { immediate: true },
)

const sessions = computed(() =>
  [...props.workouts].sort((x, y) => x.startedAt.localeCompare(y.startedAt)),
)
const labels = computed(() =>
  sessions.value.map((w) => format(new Date(w.startedAt), 'd MMM', { locale: dateFnsLocale() })),
)

function volumeOf(w: Workout, exerciseId: string): number | null {
  const sets = w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets)
  if (sets.length === 0) return null
  return Math.round(sets.filter(isWorkingSet).reduce((s, x) => s + x.reps * x.weightKg, 0))
}

const series = computed(() =>
  [a.value, b.value]
    .filter((id) => id)
    .map((id) => ({ label: nameById(id), values: sessions.value.map((w) => volumeOf(w, id)) })),
)
const weightFmt = (v: number) => formatWeight(v, props.unit)
</script>

<template>
  <section v-if="exerciseIds.length" class="mt-6">
    <h2 class="mb-2 text-sm font-medium">{{ t('analytics.byExercise.title') }}</h2>
    <div class="mb-2 grid grid-cols-2 gap-2">
      <div class="grid gap-1">
        <Label for="ex-a" class="text-xs">{{ t('analytics.byExercise.exerciseA') }}</Label>
        <NativeSelect id="ex-a" v-model="a">
          <NativeSelectOption v-for="id in exerciseIds" :key="id" :value="id">{{
            nameById(id)
          }}</NativeSelectOption>
        </NativeSelect>
      </div>
      <div class="grid gap-1">
        <Label for="ex-b" class="text-xs">{{ t('analytics.byExercise.exerciseB') }}</Label>
        <NativeSelect id="ex-b" v-model="b">
          <NativeSelectOption value="">{{ t('analytics.byExercise.none') }}</NativeSelectOption>
          <NativeSelectOption
            v-for="id in exerciseIds.filter((x) => x !== a)"
            :key="id"
            :value="id"
          >
            {{ nameById(id) }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
    <div class="rounded-xl border bg-card p-3">
      <LineChart
        :labels="labels"
        :series="series"
        :format="weightFmt"
        :title="t('analytics.byExercise.chart')"
      />
    </div>
  </section>
</template>
