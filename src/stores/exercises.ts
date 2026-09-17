import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Exercise, ExerciseInput } from '@/domain/models'
import type { ExerciseRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

export function createExercisesStore(repo: ExerciseRepository) {
  return defineStore('exercises', () => {
    const items = ref<Exercise[]>([])
    const loaded = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const byId = computed(() => new Map(items.value.map((e) => [e.id, e])))
    const active = computed(() => items.value.filter((e) => e.archivedAt === null))

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

    function upsertLocal(exercise: Exercise) {
      const idx = items.value.findIndex((e) => e.id === exercise.id)
      if (idx === -1) items.value.push(exercise)
      else items.value[idx] = exercise
      items.value.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    }

    async function create(input: ExerciseInput) {
      const exercise = await repo.create(input)
      upsertLocal(exercise)
      return exercise
    }

    async function update(id: string, input: ExerciseInput) {
      upsertLocal(await repo.update(id, input))
    }

    async function archive(id: string) {
      upsertLocal(await repo.archive(id))
    }

    async function unarchive(id: string) {
      upsertLocal(await repo.unarchive(id))
    }

    function reset() {
      items.value = []
      loaded.value = false
      error.value = null
    }

    return {
      items,
      byId,
      active,
      loaded,
      loading,
      error,
      load,
      create,
      update,
      archive,
      unarchive,
      reset,
    }
  })
}

export const useExercisesStore = createExercisesStore(repositories.exercises)
