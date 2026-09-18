import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  Routine,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSetInput,
} from '@/domain/models'
import type { WorkoutRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Sets of the most recent finished session for an exercise, in order. */
export type PreviousSets = WorkoutSet[]

const SET_DEBOUNCE_MS = 500

export function createActiveWorkoutStore(repo: WorkoutRepository) {
  return defineStore('activeWorkout', () => {
    const workout = ref<Workout | null>(null)
    const loaded = ref(false)
    const saveStatus = ref<SaveStatus>('idle')
    const previousByExercise = ref(new Map<string, PreviousSets>())

    const isActive = computed(() => workout.value !== null)

    // --- persistence helpers -------------------------------------------------
    let pending = 0
    const pendingSetUpdates = new Map<
      string,
      { timer: ReturnType<typeof setTimeout>; changes: Partial<WorkoutSetInput> }
    >()

    async function persist(op: () => Promise<unknown>) {
      pending += 1
      saveStatus.value = 'saving'
      try {
        await op()
        if (pending === 1) saveStatus.value = 'saved'
      } catch {
        saveStatus.value = 'error'
      } finally {
        pending -= 1
      }
    }

    function flushSet(setId: string) {
      const entry = pendingSetUpdates.get(setId)
      if (!entry) return
      clearTimeout(entry.timer)
      pendingSetUpdates.delete(setId)
      void persist(() => repo.updateSet(setId, entry.changes))
    }

    function queueSetUpdate(setId: string, changes: Partial<WorkoutSetInput>) {
      const existing = pendingSetUpdates.get(setId)
      if (existing) clearTimeout(existing.timer)
      const merged = { ...existing?.changes, ...changes }
      pendingSetUpdates.set(setId, {
        changes: merged,
        timer: setTimeout(() => flushSet(setId), SET_DEBOUNCE_MS),
      })
    }

    /** Flushes every debounced set edit. Call before finishing or leaving. */
    async function flushAll() {
      // Snapshot the keys: flushSet mutates the map while we iterate.
      const ids = Array.from(pendingSetUpdates.keys())
      for (const id of ids) flushSet(id)
      // Wait for in-flight persists to settle.
      while (pending > 0) await new Promise((r) => setTimeout(r, 20))
    }

    // --- lookups -------------------------------------------------------------
    function findExercise(workoutExerciseId: string): WorkoutExercise | undefined {
      return workout.value?.exercises.find((e) => e.id === workoutExerciseId)
    }

    function findSet(setId: string): { exercise: WorkoutExercise; set: WorkoutSet } | undefined {
      for (const exercise of workout.value?.exercises ?? []) {
        const set = exercise.sets.find((s) => s.id === setId)
        if (set) return { exercise, set }
      }
      return undefined
    }

    async function loadPrevious(exerciseId: string) {
      if (previousByExercise.value.has(exerciseId)) return
      try {
        const history = await repo.listByExercise(exerciseId)
        const last = [...history].reverse().find((w) => w.id !== workout.value?.id)
        const sets = last?.exercises.find((e) => e.exerciseId === exerciseId)?.sets ?? []
        previousByExercise.value.set(exerciseId, sets)
      } catch {
        previousByExercise.value.set(exerciseId, [])
      }
    }

    function previousSet(exerciseId: string, position: number): WorkoutSet | undefined {
      return previousByExercise.value.get(exerciseId)?.[position]
    }

    // --- lifecycle -----------------------------------------------------------
    async function load() {
      if (loaded.value) return
      workout.value = await repo.getActive()
      loaded.value = true
      for (const e of workout.value?.exercises ?? []) void loadPrevious(e.exerciseId)
    }

    async function start(name: string) {
      workout.value = await repo.start({ name })
      loaded.value = true
      saveStatus.value = 'saved'
      return workout.value
    }

    /** Starts a session pre-filled from a routine: target sets, reps and last/target weight. */
    async function startFromRoutine(routine: Routine) {
      const created = await repo.start({ name: routine.name, routineId: routine.id })
      workout.value = created
      loaded.value = true
      for (const [position, re] of routine.exercises.entries()) {
        await loadPrevious(re.exerciseId)
        const previous = previousByExercise.value.get(re.exerciseId) ?? []
        const weId = await repo.addExercise(created.id, re.exerciseId, position)
        const sets: WorkoutSet[] = []
        for (let i = 0; i < re.targetSets; i++) {
          const weightKg = previous[i]?.weightKg ?? re.targetWeightKg ?? 0
          sets.push(await repo.addSet(weId, i, { reps: re.targetReps, weightKg }))
        }
        created.exercises.push({ id: weId, exerciseId: re.exerciseId, position, notes: null, sets })
      }
      saveStatus.value = 'saved'
      return created
    }

    async function addExercise(exerciseId: string) {
      const w = workout.value
      if (!w) return
      const position = w.exercises.length
      const id = await repo.addExercise(w.id, exerciseId, position)
      w.exercises.push({ id, exerciseId, position, notes: null, sets: [] })
      void loadPrevious(exerciseId)
      await addSet(id)
    }

    async function removeExercise(workoutExerciseId: string) {
      const w = workout.value
      if (!w) return
      w.exercises = w.exercises.filter((e) => e.id !== workoutExerciseId)
      await persist(() => repo.removeExercise(workoutExerciseId))
    }

    /** Adds a set copying the previous set of the exercise (or last session's). */
    async function addSet(workoutExerciseId: string) {
      const exercise = findExercise(workoutExerciseId)
      if (!exercise) return
      const position = exercise.sets.length
      const template = exercise.sets[position - 1] ?? previousSet(exercise.exerciseId, position)
      const set = await repo.addSet(workoutExerciseId, position, {
        reps: template?.reps ?? 0,
        weightKg: template?.weightKg ?? 0,
        type: 'normal',
        durationSeconds: template?.durationSeconds ?? null,
        distanceM: template?.distanceM ?? null,
      })
      exercise.sets.push(set)
      saveStatus.value = 'saved'
      return set
    }

    function updateSet(setId: string, changes: Partial<WorkoutSetInput>) {
      const found = findSet(setId)
      if (!found) return
      Object.assign(found.set, changes)
      queueSetUpdate(setId, changes)
    }

    /** Marks a set complete immediately (no debounce). Returns the new state. */
    async function toggleCompleted(setId: string) {
      const found = findSet(setId)
      if (!found) return false
      found.set.completed = !found.set.completed
      flushSet(setId)
      await persist(() => repo.updateSet(setId, { completed: found.set.completed }))
      return found.set.completed
    }

    async function removeSet(setId: string) {
      const found = findSet(setId)
      if (!found) return
      pendingSetUpdates.delete(setId)
      found.exercise.sets = found.exercise.sets.filter((s) => s.id !== setId)
      await persist(() => repo.removeSet(setId))
    }

    async function finish() {
      const w = workout.value
      if (!w) return null
      await flushAll()
      const finishedAt = new Date().toISOString()
      await repo.finish(w.id, finishedAt)
      const finished: Workout = { ...w, finishedAt }
      workout.value = null
      previousByExercise.value.clear()
      saveStatus.value = 'idle'
      return finished
    }

    async function discard() {
      const w = workout.value
      if (!w) return
      await flushAll()
      await repo.remove(w.id)
      workout.value = null
      saveStatus.value = 'idle'
    }

    function reset() {
      workout.value = null
      loaded.value = false
      saveStatus.value = 'idle'
      previousByExercise.value.clear()
    }

    return {
      workout,
      loaded,
      isActive,
      saveStatus,
      load,
      start,
      startFromRoutine,
      addExercise,
      removeExercise,
      addSet,
      updateSet,
      toggleCompleted,
      removeSet,
      previousSet,
      flushAll,
      finish,
      discard,
      reset,
    }
  })
}

export const useActiveWorkoutStore = createActiveWorkoutStore(repositories.workouts)
