<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { Workout } from '@/domain/models'
import { workoutDurationMinutes, workoutVolumeKg, weekStartOf } from '@/domain/analytics'
import { formatWeight } from '@/domain/units/weight'
import { dateFnsLocale } from '@/i18n'
import { useWorkoutsStore } from '@/stores/workouts'
import { useProfileStore } from '@/stores/profile'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const { t } = useI18n()
const store = useWorkoutsStore()
const profileStore = useProfileStore()

const month = ref(startOfMonth(new Date()))
const workouts = ref<Workout[]>([])
const loaded = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')
const locale = () => ({ locale: dateFnsLocale() })

async function load() {
  loaded.value = false
  const from = startOfWeek(startOfMonth(month.value), { weekStartsOn: 1 })
  const to = endOfWeek(endOfMonth(month.value), { weekStartsOn: 1 })
  workouts.value = await store.loadRange(from.toISOString(), to.toISOString())
  loaded.value = true
}

watch(month, load, { immediate: true })

const days = computed(() =>
  eachDayOfInterval({
    start: startOfWeek(startOfMonth(month.value), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month.value), { weekStartsOn: 1 }),
  }),
)

const trainedDays = computed(() => workouts.value.map((w) => new Date(w.startedAt)))

function trainedOn(day: Date) {
  return trainedDays.value.some((d) => isSameDay(d, day))
}

const weekdayLabels = computed(() =>
  days.value.slice(0, 7).map((d) => format(d, 'EEEEE', locale())),
)

const weeks = computed(() => {
  const inMonth = workouts.value.filter((w) => isSameMonth(new Date(w.startedAt), month.value))
  const map = new Map<string, Workout[]>()
  for (const w of inMonth) {
    const key = weekStartOf(w.startedAt).toISOString()
    map.set(key, [...(map.get(key) ?? []), w])
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      label: t('history.weekOf', { date: format(new Date(key), 'd MMM', locale()) }),
      items: items.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    }))
})

function describe(w: Workout) {
  const parts = [format(new Date(w.startedAt), 'EEE d, HH:mm', locale())]
  const volume = workoutVolumeKg(w)
  if (volume > 0) parts.push(formatWeight(volume, unit.value))
  const minutes = workoutDurationMinutes(w)
  if (minutes > 0) parts.push(t('common.minutes', { n: minutes }))
  return parts.join(' · ')
}
</script>

<template>
  <header class="flex items-center gap-2">
    <h1 class="flex-1 text-2xl font-semibold tracking-tight">{{ t('history.title') }}</h1>
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('history.prevMonth')"
      @click="month = addMonths(month, -1)"
    >
      <ChevronLeft class="size-5" />
    </Button>
    <span class="min-w-28 text-center text-sm font-medium capitalize">
      {{ format(month, 'MMMM yyyy', locale()) }}
    </span>
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('history.nextMonth')"
      @click="month = addMonths(month, 1)"
    >
      <ChevronRight class="size-5" />
    </Button>
  </header>

  <div class="mt-4 rounded-xl border bg-card p-3" role="grid" :aria-label="t('history.calendar')">
    <div
      class="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground uppercase"
      role="row"
    >
      <span v-for="(label, i) in weekdayLabels" :key="i" role="columnheader">{{ label }}</span>
    </div>
    <div class="mt-1 grid grid-cols-7 gap-1">
      <div
        v-for="day in days"
        :key="day.toISOString()"
        role="gridcell"
        :aria-label="
          trainedOn(day)
            ? t('history.trainedOn', { date: format(day, 'PPP', locale()) })
            : format(day, 'PPP', locale())
        "
        :class="
          cn(
            'flex aspect-square items-center justify-center rounded-md text-sm',
            !isSameMonth(day, month) && 'text-muted-foreground/40',
            trainedOn(day) && 'bg-primary font-semibold text-primary-foreground',
            isSameDay(day, new Date()) && !trainedOn(day) && 'ring-1 ring-primary',
          )
        "
      >
        {{ day.getDate() }}
      </div>
    </div>
  </div>

  <div v-if="!loaded" class="mt-4 grid gap-2">
    <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
  </div>

  <p v-else-if="store.error" class="mt-6 text-center text-sm text-destructive">{{ store.error }}</p>

  <div v-else-if="weeks.length === 0" class="mt-10 text-center text-sm text-muted-foreground">
    <p>{{ t('history.empty') }}</p>
    <p>{{ t('history.emptyHint') }}</p>
  </div>

  <section v-for="week in weeks" v-else :key="week.key" class="mt-5">
    <h2 class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {{ week.label }} · {{ t('history.sessions', { n: week.items.length }) }}
    </h2>
    <ul class="divide-y rounded-lg border">
      <li v-for="w in week.items" :key="w.id">
        <RouterLink
          :to="{ name: 'workout-detail', params: { id: w.id } }"
          class="flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-accent"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ w.name }}</p>
            <p class="text-xs text-muted-foreground">{{ describe(w) }}</p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
