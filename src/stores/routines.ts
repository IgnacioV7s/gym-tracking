import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Routine, RoutineInput } from '@/domain/models'
import type { RoutineRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

export function createRoutinesStore(repo: RoutineRepository) {
  return defineStore('routines', () => {
    const items = ref<Routine[]>([])
    const loaded = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const byId = computed(() => new Map(items.value.map((r) => [r.id, r])))

    async function load(force = false) {
      if (loaded.value && !force) return
      loading.value = true
      error.value = null
      try {
        items.value = await repo.list()
        loaded.value = true
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      } finally {
        loading.value = false
      }
    }

    function upsertLocal(routine: Routine) {
      items.value = [routine, ...items.value.filter((r) => r.id !== routine.id)]
    }

    async function get(id: string): Promise<Routine | null> {
      return byId.value.get(id) ?? (await repo.get(id))
    }

    async function create(input: RoutineInput) {
      const routine = await repo.create(input)
      upsertLocal(routine)
      return routine
    }

    async function update(id: string, input: RoutineInput) {
      const routine = await repo.update(id, input)
      upsertLocal(routine)
      return routine
    }

    async function duplicate(id: string) {
      const source = await get(id)
      if (!source) throw new Error('Routine not found')
      return create({
        name: `${source.name} (copia)`,
        notes: source.notes,
        exercises: source.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetWeightKg: e.targetWeightKg,
          restSeconds: e.restSeconds,
        })),
      })
    }

    async function remove(id: string) {
      await repo.remove(id)
      items.value = items.value.filter((r) => r.id !== id)
    }

    function reset() {
      items.value = []
      loaded.value = false
      error.value = null
    }

    return {
      items,
      byId,
      loaded,
      loading,
      error,
      load,
      get,
      create,
      update,
      duplicate,
      remove,
      reset,
    }
  })
}

export const useRoutinesStore = createRoutinesStore(repositories.routines)
