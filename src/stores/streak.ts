import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { format, subDays } from 'date-fns'
import { computeStreak, dayKey } from '@/domain/analytics'
import type { RestDayRepository, WorkoutRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

/** How far back we look for streak purposes. */
const LOOKBACK_DAYS = 400

export function createStreakStore(workouts: WorkoutRepository, restDays: RestDayRepository) {
  return defineStore('streak', () => {
    const trainedDays = ref(new Set<string>())
    const restDaySet = ref(new Set<string>())
    const loaded = ref(false)
    const loading = ref(false)

    const streak = computed(() =>
      computeStreak({
        trainedDays: trainedDays.value,
        restDays: restDaySet.value,
        today: new Date(),
      }),
    )

    async function load(force = false) {
      if (loaded.value && !force) return
      loading.value = true
      try {
        const to = new Date()
        const from = subDays(to, LOOKBACK_DAYS)
        const [sessions, rests] = await Promise.all([
          workouts.listBetween(from.toISOString(), to.toISOString()),
          restDays.listBetween(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')),
        ])
        trainedDays.value = new Set(sessions.map((w) => dayKey(w.startedAt)))
        restDaySet.value = new Set(rests)
        loaded.value = true
      } finally {
        loading.value = false
      }
    }

    /** Call after finishing a workout so the streak reflects it immediately. */
    function markTrained(date: Date = new Date()) {
      trainedDays.value = new Set(trainedDays.value).add(dayKey(date))
    }

    async function markRest(date: Date = new Date()) {
      const key = dayKey(date)
      await restDays.add(key)
      restDaySet.value = new Set(restDaySet.value).add(key)
    }

    async function unmarkRest(date: Date = new Date()) {
      const key = dayKey(date)
      await restDays.remove(key)
      const next = new Set(restDaySet.value)
      next.delete(key)
      restDaySet.value = next
    }

    function reset() {
      trainedDays.value = new Set()
      restDaySet.value = new Set()
      loaded.value = false
    }

    return {
      streak,
      trainedDays,
      restDays: restDaySet,
      loaded,
      loading,
      load,
      markTrained,
      markRest,
      unmarkRest,
      reset,
    }
  })
}

export const useStreakStore = createStreakStore(repositories.workouts, repositories.restDays)
