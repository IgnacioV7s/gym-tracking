<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarCheck } from '@lucide/vue'
import type { Workout } from '@/domain/models'
import {
  isWithin,
  percentChange,
  periodFor,
  personalRecords,
  previousPeriod,
  workoutVolumeKg,
} from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { useWorkoutsStore } from '@/stores/workouts'
import { useProfileStore } from '@/stores/profile'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const { t } = useI18n()
const store = useWorkoutsStore()
const profileStore = useProfileStore()

const week = periodFor('week')
const last = previousPeriod(week)
const current = ref<Workout[]>([])
const before = ref<Workout[]>([])
const loaded = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')

onMounted(async () => {
  ;[current.value, before.value] = await Promise.all([
    store.loadRange(week.from.toISOString(), week.to.toISOString()),
    store.loadRange(last.from.toISOString(), last.to.toISOString()),
  ])
  loaded.value = true
})

const volume = computed(() => current.value.reduce((s, w) => s + workoutVolumeKg(w), 0))
const volumeBefore = computed(() => before.value.reduce((s, w) => s + workoutVolumeKg(w), 0))
const delta = computed(() => percentChange(volume.value, volumeBefore.value))
const records = computed(
  () =>
    [...personalRecords([...before.value, ...current.value]).values()].filter(
      (r) => r.bestOneRepMax && isWithin(r.bestOneRepMax.date, week),
    ).length,
)

const deltaLabel = computed(() =>
  delta.value === null ? null : `${delta.value > 0 ? '+' : ''}${Math.round(delta.value)}%`,
)
</script>

<template>
  <Card :aria-label="t('weekly.title')" data-testid="weekly-card">
    <CardContent class="flex items-center gap-3">
      <CalendarCheck class="size-8 shrink-0 text-primary" aria-hidden="true" />
      <div v-if="!loaded" class="flex-1">
        <Skeleton class="h-5 w-48" />
      </div>
      <div v-else class="min-w-0 flex-1 text-sm">
        <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {{ t('weekly.title') }}
        </p>
        <p v-if="current.length === 0" class="text-muted-foreground">{{ t('weekly.empty') }}</p>
        <template v-else>
          <p class="font-semibold">
            {{ t('weekly.sessions', { n: current.length }) }} ·
            {{ t('weekly.volume', { value: formatWeight(volume, unit) }) }}
          </p>
          <p class="text-xs text-muted-foreground">
            <span
              v-if="deltaLabel"
              :class="delta! >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'"
            >
              {{ t('weekly.vsLast', { delta: deltaLabel }) }}
            </span>
            <span v-if="deltaLabel"> · </span>
            {{ records > 0 ? t('weekly.records', { n: records }) : t('weekly.noRecords') }}
          </p>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
