import { ref, type Ref } from 'vue'
import type { Workout, WorkoutSet, WorkoutSetInput } from '@/domain/models'
import type { WorkoutRepository } from '@/domain/repositories'
import { createOpQueue, isQueueSupported, type OpQueue } from './queue'

/** Writes that can be deferred; reads always need the network. */
const QUEUEABLE = [
  'updateMeta',
  'finish',
  'remove',
  'addExercise',
  'removeExercise',
  'updateExerciseNotes',
  'setExercisePositions',
  'addSet',
  'updateSet',
  'removeSet',
] as const
type Queueable = (typeof QUEUEABLE)[number]

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const message = error instanceof Error ? error.message : String(error)
  return /fetch|network|failed to fetch|load failed|timeout/i.test(message)
}

export interface OfflineWorkoutRepository extends WorkoutRepository {
  /** Number of writes waiting for the network. */
  pending: Ref<number>
  /** Replays queued writes in order. Stops at the first network failure. */
  flush(): Promise<void>
}

/**
 * Wraps a repository so writes survive a dead connection: every mutation gets
 * a client-generated id, is applied optimistically by the caller, and — when
 * the network is down — lands in a durable queue that is replayed in order on
 * reconnect. Server-side rejections (4xx) are dropped instead of blocking the
 * queue forever, since replaying them would fail identically.
 */
export function createOfflineWorkoutRepository(
  inner: WorkoutRepository,
  queue: OpQueue = createOpQueue(),
): OfflineWorkoutRepository {
  const pending = ref(0)
  let flushing: Promise<void> | null = null

  async function refreshPending() {
    try {
      pending.value = await queue.size()
    } catch {
      pending.value = 0
    }
  }
  void refreshPending()

  async function defer<T>(method: string, args: unknown[], offlineValue: T): Promise<T> {
    // With no durable queue the write is lost anyway; surface it as an error
    // instead of pretending it was saved.
    if (!isQueueSupported()) throw new Error(`Cannot defer ${method}: no offline storage`)
    await queue.enqueue(method, args)
    await refreshPending()
    return offlineValue
  }

  async function run<T>(method: Queueable, args: unknown[], offlineValue: T): Promise<T> {
    const call = inner[method] as (...a: unknown[]) => Promise<T>
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return defer(method, args, offlineValue)
    }
    try {
      return await call.apply(inner, args)
    } catch (error) {
      if (!isNetworkError(error)) throw error
      return defer(method, args, offlineValue)
    }
  }

  async function flush(): Promise<void> {
    if (flushing) return flushing
    flushing = (async () => {
      try {
        for (const op of await queue.list()) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) break
          try {
            const call = inner[op.method as Queueable] as (...a: unknown[]) => Promise<unknown>
            await call.apply(inner, op.args)
          } catch (error) {
            // Keep it queued only while the failure is the network's fault.
            if (isNetworkError(error)) break
            console.warn('[offline] dropping rejected operation', op.method, error)
          }
          if (op.seq !== undefined) await queue.remove(op.seq)
        }
      } finally {
        await refreshPending()
        flushing = null
      }
    })()
    return flushing
  }

  if (typeof window !== 'undefined' && isQueueSupported()) {
    window.addEventListener('online', () => void flush())
    void flush()
  }

  return {
    // Reads go straight through; offline they reject and the UI shows the banner.
    listBetween: (from, to) => inner.listBetween(from, to),
    get: (id) => inner.get(id),
    getActive: () => inner.getActive(),
    getLastFinished: () => inner.getLastFinished(),
    listByExercise: (id) => inner.listByExercise(id),

    // `start` needs a row to exist before anything can reference it, so it is
    // queued with the id the caller will use locally.
    async start(input) {
      const id = input.id ?? crypto.randomUUID()
      const local: Workout = {
        id,
        routineId: input.routineId ?? null,
        name: input.name,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        notes: null,
        exercises: [],
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return defer('start', [{ ...input, id }], local)
      }
      try {
        return await inner.start({ ...input, id })
      } catch (error) {
        if (!isNetworkError(error)) throw error
        return defer('start', [{ ...input, id }], local)
      }
    },

    updateMeta: (id, changes) => run('updateMeta', [id, changes], undefined),
    finish: (id, finishedAt) => run('finish', [id, finishedAt], undefined),
    remove: (id) => run('remove', [id], undefined),

    addExercise(workoutId, exerciseId, position, id) {
      const newId = id ?? crypto.randomUUID()
      return run('addExercise', [workoutId, exerciseId, position, newId], newId)
    },
    removeExercise: (id) => run('removeExercise', [id], undefined),
    updateExerciseNotes: (id, notes) => run('updateExerciseNotes', [id, notes], undefined),
    setExercisePositions: (entries) => run('setExercisePositions', [entries], undefined),

    addSet(workoutExerciseId, position, input: WorkoutSetInput, id) {
      const newId = id ?? crypto.randomUUID()
      const local: WorkoutSet = {
        id: newId,
        position,
        reps: input.reps,
        weightKg: input.weightKg,
        rpe: input.rpe ?? null,
        type: input.type ?? 'normal',
        completed: input.completed ?? false,
        durationSeconds: input.durationSeconds ?? null,
        distanceM: input.distanceM ?? null,
      }
      return run('addSet', [workoutExerciseId, position, input, newId], local)
    },
    updateSet: (id, changes) => run('updateSet', [id, changes], undefined),
    removeSet: (id) => run('removeSet', [id], undefined),

    pending,
    flush,
  }
}
