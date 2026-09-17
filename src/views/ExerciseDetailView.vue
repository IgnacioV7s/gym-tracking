<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { ChevronLeft } from '@lucide/vue'
import type { Workout } from '@/domain/models'
import { bestOneRepMax, linearTrend, personalRecords } from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { dateFnsLocale } from '@/i18n'
import { useWorkoutsStore } from '@/stores/workouts'
import { useExercisesStore } from '@/stores/exercises'
import { useProfileStore } from '@/stores/profile'
import { useExerciseName } from '@/composables/useExerciseName'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import LineChart from '@/components/charts/LineChart.vue'

const { t } = useI18n()
const { nameById } = useExerciseName()
const route = useRoute()
const store = useWorkoutsStore()
const exercises = useExercisesStore()
const profileStore = useProfileStore()

const id = computed(() => String(route.params.id))
const history = ref<Workout[]>([])
const loaded = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')
const formula = computed(() => profileStore.profile?.oneRepMaxFormula ?? 'epley')
const exercise = computed(() => exercises.byId.get(id.value))
const locale = () => ({ locale: dateFnsLocale() })

onMounted(async () => {
  await exercises.load()
  history.value = await store.listByExercise(id.value)
  loaded.value = true
})

/** One point per finished session: the best estimated 1RM for this exercise. */
const points = computed(() =>
  history.value
    .map((w) => {
      const sets = w.exercises.filter((e) => e.exerciseId === id.value).flatMap((e) => e.sets)
      return { date: w.startedAt, value: bestOneRepMax(sets, formula.value), workoutId: w.id, sets }
    })
    .filter((p) => p.value > 0),
)

const record = computed(() => personalRecords(history.value, formula.value).get(id.value))
const trend = computed(() => linearTrend(points.value.map(({ date, value }) => ({ date, value }))))

const labels = computed(() => points.value.map((p) => format(new Date(p.date), 'd MMM', locale())))
const values = computed(() => points.value.map((p) => Math.round(p.value * 10) / 10))
const recent = computed(() => [...points.value].reverse().slice(0, 10))
const weightFmt = (v: number) => formatWeight(v, unit.value)
</script>

<template>
  <header class="flex items-center gap-2">
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'exercises' }" :aria-label="t('common.back')">
        <ChevronLeft class="size-5" />
      </RouterLink>
    </Button>
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-2xl font-semibold tracking-tight">{{ nameById(id) }}</h1>
      <p v-if="exercise" class="text-xs text-muted-foreground">
        {{ t(`muscle.${exercise.primaryMuscle}`) }} · {{ t(`equipment.${exercise.equipment}`) }}
      </p>
    </div>
  </header>

  <div v-if="!loaded" class="mt-4 grid gap-3">
    <Skeleton class="h-20 w-full" />
    <Skeleton class="h-48 w-full" />
  </div>

  <p v-else-if="points.length === 0" class="mt-10 text-center text-sm text-muted-foreground">
    {{ t('analytics.empty') }}
  </p>

  <template v-else>
    <dl class="mt-4 grid grid-cols-3 gap-2">
      <div class="rounded-xl border bg-card p-3">
        <dt class="text-xs text-muted-foreground">{{ t('analytics.oneRepMax') }}</dt>
        <dd class="font-semibold tabular-nums">
          {{ formatWeight(record?.bestOneRepMax?.valueKg ?? 0, unit) }}
        </dd>
      </div>
      <div class="rounded-xl border bg-card p-3">
        <dt class="text-xs text-muted-foreground">{{ t('analytics.bestSet') }}</dt>
        <dd class="font-semibold tabular-nums">
          {{
            record?.bestWeight
              ? `${formatWeight(record.bestWeight.weightKg, unit)} × ${record.bestWeight.reps}`
              : '—'
          }}
        </dd>
      </div>
      <div class="rounded-xl border bg-card p-3">
        <dt class="text-xs text-muted-foreground">{{ t('analytics.trend') }}</dt>
        <dd
          class="font-semibold tabular-nums"
          :class="
            trend.slopePerWeek > 0
              ? 'text-green-600 dark:text-green-500'
              : trend.slopePerWeek < 0
                ? 'text-destructive'
                : ''
          "
        >
          {{
            t('analytics.perWeek', {
              value: `${trend.slopePerWeek > 0 ? '+' : ''}${formatWeight(trend.slopePerWeek, unit)}`,
            })
          }}
        </dd>
      </div>
    </dl>

    <section class="mt-6">
      <h2 class="mb-2 text-sm font-medium">{{ t('analytics.oneRepMaxHistory') }}</h2>
      <div class="rounded-xl border bg-card p-3">
        <LineChart
          :labels="labels"
          :values="values"
          :format="weightFmt"
          :title="t('analytics.oneRepMaxHistory')"
        />
      </div>
    </section>

    <section class="mt-6">
      <h2 class="mb-2 text-sm font-medium">{{ t('analytics.lastSessions') }}</h2>
      <ul class="divide-y rounded-xl border bg-card">
        <li v-for="p in recent" :key="p.workoutId">
          <RouterLink
            :to="{ name: 'workout-detail', params: { id: p.workoutId } }"
            class="flex min-h-12 items-center gap-3 px-3 py-2 hover:bg-accent"
          >
            <span class="w-20 shrink-0 text-sm text-muted-foreground">{{
              format(new Date(p.date), 'd MMM yy', locale())
            }}</span>
            <span class="min-w-0 flex-1 truncate text-sm tabular-nums">
              {{
                p.sets
                  .filter((s) => s.completed && s.type !== 'warmup')
                  .map((s) => `${formatWeight(s.weightKg, unit).replace(` ${unit}`, '')}×${s.reps}`)
                  .join('  ')
              }}
            </span>
            <span class="text-xs text-muted-foreground">1RM {{ formatWeight(p.value, unit) }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </template>
</template>
