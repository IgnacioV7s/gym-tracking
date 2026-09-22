<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Trophy } from '@lucide/vue'
import type { MuscleGroup, Workout } from '@/domain/models'
import {
  personalRecords,
  setsByMuscle,
  weeklyBuckets,
  workoutDurationMinutes,
  workoutVolumeKg,
  workoutWorkingSets,
  percentChange,
  isWithin,
  cardioTotals,
  type PeriodPreset,
} from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { dateFnsLocale } from '@/i18n'
import { usePeriod } from '@/composables/usePeriod'
import { useExerciseName } from '@/composables/useExerciseName'
import { useWorkoutsStore } from '@/stores/workouts'
import { useExercisesStore } from '@/stores/exercises'
import { useProfileStore } from '@/stores/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BarChart from '@/components/charts/BarChart.vue'
import ExerciseVolumeSection from '@/components/analytics/ExerciseVolumeSection.vue'
import BodyWeightSection from '@/components/analytics/BodyWeightSection.vue'

const { t } = useI18n()
const { nameById } = useExerciseName()
const store = useWorkoutsStore()
const exercises = useExercisesStore()
const profileStore = useProfileStore()
const { preset, offset, period, previous, setPreset, shift, setCustom } = usePeriod('month')

const PRESETS: PeriodPreset[] = ['week', 'month', '3months', 'year', 'custom']
const current = ref<Workout[]>([])
const before = ref<Workout[]>([])
const loaded = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')
const formula = computed(() => profileStore.profile?.oneRepMaxFormula ?? 'epley')
const locale = () => ({ locale: dateFnsLocale() })

async function load() {
  loaded.value = false
  const [a, b] = await Promise.all([
    store.loadRange(period.value.from.toISOString(), period.value.to.toISOString()),
    store.loadRange(previous.value.from.toISOString(), previous.value.to.toISOString()),
  ])
  current.value = a
  before.value = b
  loaded.value = true
}

onMounted(async () => {
  await exercises.load()
  await load()
})
watch(period, load)

function summarize(list: Workout[]) {
  const sessions = list.length
  const volume = list.reduce((s, w) => s + workoutVolumeKg(w), 0)
  const sets = list.reduce((s, w) => s + workoutWorkingSets(w), 0)
  const minutes = list.reduce((s, w) => s + workoutDurationMinutes(w), 0)
  return { sessions, volume, sets, avgMinutes: sessions ? Math.round(minutes / sessions) : 0 }
}

const isCardio = (id: string) => exercises.byId.get(id)?.primaryMuscle === 'cardio'
const cardio = computed(() => cardioTotals(current.value, isCardio))
const cardioPrev = computed(() => cardioTotals(before.value, isCardio))

const now = computed(() => summarize(current.value))
const prev = computed(() => summarize(before.value))

const stats = computed(() => [
  {
    key: 'sessions',
    label: t('analytics.sessions'),
    value: String(now.value.sessions),
    delta: percentChange(now.value.sessions, prev.value.sessions),
  },
  {
    key: 'volume',
    label: t('analytics.volume'),
    value: formatWeight(now.value.volume, unit.value),
    delta: percentChange(now.value.volume, prev.value.volume),
  },
  {
    key: 'sets',
    label: t('analytics.sets'),
    value: String(now.value.sets),
    delta: percentChange(now.value.sets, prev.value.sets),
  },
  {
    key: 'duration',
    label: t('analytics.avgDuration'),
    value: t('common.minutes', { n: now.value.avgMinutes }),
    delta: percentChange(now.value.avgMinutes, prev.value.avgMinutes),
  },
  ...(cardio.value.seconds > 0 || cardioPrev.value.seconds > 0
    ? [
        {
          key: 'cardio',
          label: t('cardio.totalTime'),
          value: t('common.minutes', { n: Math.round(cardio.value.seconds / 60) }),
          delta: percentChange(cardio.value.seconds, cardioPrev.value.seconds),
        },
        {
          key: 'distance',
          label: t('cardio.totalDistance'),
          value: `${Math.round(cardio.value.meters / 100) / 10} km`,
          delta: percentChange(cardio.value.meters, cardioPrev.value.meters),
        },
      ]
    : []),
])

const weekly = computed(() => weeklyBuckets(current.value))
const weeklyLabels = computed(() =>
  weekly.value.map((b) => format(new Date(`${b.weekStart}T00:00:00`), 'd MMM', locale())),
)
const weeklyVolume = computed(() => weekly.value.map((b) => Math.round(b.volumeKg)))

const muscles = computed(() => {
  const map = setsByMuscle(current.value, exercises.byId)
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, sets]) => ({ muscle: muscle as MuscleGroup, sets }))
})

const records = computed(() => {
  const all = personalRecords(current.value, formula.value)
  return [...all.values()]
    .filter((r) => r.bestOneRepMax && isWithin(r.bestOneRepMax.date, period.value))
    .sort((a, b) => (b.bestOneRepMax?.valueKg ?? 0) - (a.bestOneRepMax?.valueKg ?? 0))
    .slice(0, 8)
})

function formatDelta(delta: number | null) {
  if (delta === null) return null
  const sign = delta > 0 ? '+' : ''
  return `${sign}${Math.round(delta)}%`
}

const periodLabel = computed(
  () =>
    `${format(period.value.from, 'd MMM', locale())} – ${format(period.value.to, 'd MMM yyyy', locale())}`,
)

function onCustomDate(which: 'from' | 'to', e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (!value) return
  const date = new Date(`${value}T00:00:00`)
  setCustom(which === 'from' ? date : period.value.from, which === 'to' ? date : period.value.to)
}

const weightFmt = (v: number) => formatWeight(v, unit.value)
</script>

<template>
  <h1 class="text-2xl font-semibold tracking-tight">{{ t('analytics.title') }}</h1>

  <Tabs :model-value="preset" class="mt-4" @update:model-value="setPreset($event as PeriodPreset)">
    <TabsList class="w-full" :aria-label="t('analytics.period')">
      <TabsTrigger v-for="p in PRESETS" :key="p" :value="p" class="flex-1 text-xs">
        {{ t(`analytics.preset.${p}`) }}
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <div v-if="preset === 'custom'" class="mt-3 grid grid-cols-2 gap-2">
    <div class="grid gap-1">
      <Label for="from" class="text-xs">{{ t('analytics.from') }}</Label>
      <Input
        id="from"
        type="date"
        :model-value="format(period.from, 'yyyy-MM-dd')"
        @change="onCustomDate('from', $event)"
      />
    </div>
    <div class="grid gap-1">
      <Label for="to" class="text-xs">{{ t('analytics.to') }}</Label>
      <Input
        id="to"
        type="date"
        :model-value="format(period.to, 'yyyy-MM-dd')"
        @change="onCustomDate('to', $event)"
      />
    </div>
  </div>
  <div v-else class="mt-3 flex items-center justify-between">
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('analytics.previousPeriod')"
      @click="shift(1)"
    >
      <ChevronLeft class="size-5" />
    </Button>
    <span class="text-sm font-medium">{{ periodLabel }}</span>
    <Button
      variant="ghost"
      size="icon"
      :disabled="offset === 0"
      :aria-label="t('analytics.nextPeriod')"
      @click="shift(-1)"
    >
      <ChevronRight class="size-5" />
    </Button>
  </div>

  <div v-if="!loaded" class="mt-4 grid gap-3">
    <Skeleton class="h-24 w-full" />
    <Skeleton class="h-48 w-full" />
  </div>

  <template v-else>
    <dl v-reveal class="mt-4 grid grid-cols-2 gap-2">
      <div v-for="s in stats" :key="s.key" class="rounded-xl border bg-card p-3">
        <dt class="text-xs text-muted-foreground">{{ s.label }}</dt>
        <dd class="text-xl font-semibold tabular-nums">{{ s.value }}</dd>
        <dd
          class="text-xs tabular-nums"
          :class="
            s.delta === null
              ? 'text-muted-foreground'
              : s.delta >= 0
                ? 'text-green-600 dark:text-green-500'
                : 'text-destructive'
          "
        >
          {{ formatDelta(s.delta) ?? '—' }}
          <span class="text-muted-foreground">{{
            s.delta === null ? t('analytics.noPrevious') : t('analytics.vsPrevious')
          }}</span>
        </dd>
      </div>
    </dl>

    <p v-if="current.length === 0" class="mt-8 text-center text-sm text-muted-foreground">
      {{ t('analytics.empty') }}
    </p>

    <template v-else>
      <section class="mt-6">
        <h2 class="mb-2 text-sm font-medium">{{ t('analytics.volumePerWeek') }}</h2>
        <div class="rounded-xl border bg-card p-3">
          <BarChart
            :labels="weeklyLabels"
            :values="weeklyVolume"
            :format="weightFmt"
            :title="t('analytics.volumePerWeek')"
          />
        </div>
      </section>

      <section class="mt-6">
        <h2 class="mb-2 text-sm font-medium">{{ t('analytics.setsByMuscle') }}</h2>
        <ul class="rounded-xl border bg-card p-3">
          <li v-for="m in muscles" :key="m.muscle" class="flex items-center gap-2 py-1 text-sm">
            <span class="w-28 shrink-0 truncate">{{ t(`muscle.${m.muscle}`) }}</span>
            <span
              class="h-2 rounded-full bg-primary"
              :style="{
                width: `${(m.sets / (muscles[0]?.sets ?? 1)) * 100}%`,
                maxWidth: 'calc(100% - 9rem)',
              }"
              aria-hidden="true"
            />
            <span class="ml-auto tabular-nums text-muted-foreground">{{ m.sets }}</span>
          </li>
        </ul>
      </section>

      <ExerciseVolumeSection :workouts="current" :unit="unit" />

      <section class="mt-6">
        <h2 class="mb-2 flex items-center gap-1 text-sm font-medium">
          <Trophy class="size-4" aria-hidden="true" />
          {{ t('analytics.records') }}
        </h2>
        <p v-if="records.length === 0" class="text-sm text-muted-foreground">
          {{ t('analytics.noRecords') }}
        </p>
        <ul v-else v-reveal class="divide-y rounded-xl border bg-card">
          <li v-for="r in records" :key="r.exerciseId">
            <RouterLink
              :to="{ name: 'exercise-detail', params: { id: r.exerciseId } }"
              class="flex min-h-12 items-center gap-3 px-3 py-2 hover:bg-accent"
            >
              <span class="min-w-0 flex-1 truncate">{{ nameById(r.exerciseId) }}</span>
              <span class="text-sm tabular-nums">
                {{ formatWeight(r.bestOneRepMax!.weightKg, unit) }} × {{ r.bestOneRepMax!.reps }}
              </span>
              <span class="text-xs text-muted-foreground">
                1RM {{ formatWeight(r.bestOneRepMax!.valueKg, unit) }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>

    <BodyWeightSection :period="period" :unit="unit" />
  </template>
</template>
