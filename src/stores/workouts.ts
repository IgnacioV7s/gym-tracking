import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Workout, WorkoutSetInput } from '@/domain/models'
import type { WorkoutRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

function rangeKey(from: string, to: string) {
  return `${from}|${to}`
}

/** Finished workouts, cached per requested range and per id. */
export function createWorkoutsStore(repo: WorkoutRepository) {
  return defineStore('workouts', () => {
    const byId = ref(new Map<string, Workout>())
    const ranges = ref(new Map<string, string[]>())
    const loading = ref(false)
    const error = ref<string | null>(null)

    function remember(workout: Workout) {
      byId.value.set(workout.id, workout)
    }

    async function loadRange(from: string, to: string, force = false): Promise<Workout[]> {
      const key = rangeKey(from, to)
      const cached = ranges.value.get(key)
      if (cached && !force) {
        return cached.map((id) => byId.value.get(id)).filter((w): w is Workout => !!w)
      }
      loading.value = true
      error.value = null
      try {
        const items = await repo.listBetween(from, to)
        items.forEach(remember)
        ranges.value.set(
          key,
          items.map((w) => w.id),
        )
        return items
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
        return []
      } finally {
        loading.value = false
      }
    }

    async function get(id: string): Promise<Workout | null> {
      const cached = byId.value.get(id)
      if (cached) return cached
      const workout = await repo.get(id)
      if (workout) remember(workout)
      return workout
    }

    async function listByExercise(exerciseId: string): Promise<Workout[]> {
      const items = await repo.listByExercise(exerciseId)
      items.forEach(remember)
      return items
    }

    async function updateMeta(id: string, changes: { name?: string; notes?: string | null }) {
      await repo.updateMeta(id, changes)
      const w = byId.value.get(id)
      if (w) Object.assign(w, changes)
    }

    async function updateSet(workoutId: string, setId: string, changes: Partial<WorkoutSetInput>) {
      await repo.updateSet(setId, changes)
      const w = byId.value.get(workoutId)
      const set = w?.exercises.flatMap((e) => e.sets).find((s) => s.id === setId)
      if (set) Object.assign(set, changes)
    }

    async function removeSet(workoutId: string, setId: string) {
      await repo.removeSet(setId)
      const w = byId.value.get(workoutId)
      if (!w) return
      for (const e of w.exercises) e.sets = e.sets.filter((s) => s.id !== setId)
    }

    async function remove(id: string) {
      await repo.remove(id)
      byId.value.delete(id)
      for (const [key, ids] of ranges.value) {
        ranges.value.set(
          key,
          ids.filter((x) => x !== id),
        )
      }
    }

    /** Drop range caches so the next load refetches (e.g. after finishing a session). */
    function invalidate() {
      ranges.value.clear()
    }

    function reset() {
      byId.value.clear()
      ranges.value.clear()
      error.value = null
    }

    return {
      loading,
      error,
      loadRange,
      get,
      listByExercise,
      updateMeta,
      updateSet,
      removeSet,
      remove,
      invalidate,
      reset,
    }
  })
}

export const useWorkoutsStore = createWorkoutsStore(repositories.workouts)
