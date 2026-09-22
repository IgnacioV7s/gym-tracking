import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import type { WorkoutRepository } from '@/domain/repositories'
import { createOpQueue } from './queue'
import { createOfflineWorkoutRepository } from './offlineWorkoutRepository'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

function innerRepo(overrides: Partial<WorkoutRepository> = {}): WorkoutRepository {
  return {
    listBetween: vi.fn<WorkoutRepository['listBetween']>().mockResolvedValue([]),
    get: vi.fn<WorkoutRepository['get']>().mockResolvedValue(null),
    getActive: vi.fn<WorkoutRepository['getActive']>().mockResolvedValue(null),
    getLastFinished: vi.fn<WorkoutRepository['getLastFinished']>().mockResolvedValue(null),
    listByExercise: vi.fn<WorkoutRepository['listByExercise']>().mockResolvedValue([]),
    start: vi.fn<WorkoutRepository['start']>(async (input) => ({
      id: input.id ?? 'server-id',
      routineId: input.routineId ?? null,
      name: input.name,
      startedAt: 's',
      finishedAt: null,
      notes: null,
      exercises: [],
    })),
    updateMeta: vi.fn<WorkoutRepository['updateMeta']>().mockResolvedValue(),
    finish: vi.fn<WorkoutRepository['finish']>().mockResolvedValue(),
    remove: vi.fn<WorkoutRepository['remove']>().mockResolvedValue(),
    addExercise: vi.fn<WorkoutRepository['addExercise']>(async (_w, _e, _p, id) => id ?? 'we'),
    removeExercise: vi.fn<WorkoutRepository['removeExercise']>().mockResolvedValue(),
    updateExerciseNotes: vi.fn<WorkoutRepository['updateExerciseNotes']>().mockResolvedValue(),
    setExercisePositions: vi.fn<WorkoutRepository['setExercisePositions']>().mockResolvedValue(),
    addSet: vi.fn<WorkoutRepository['addSet']>(async (_we, position, input, id) => ({
      id: id ?? 'set',
      position,
      reps: input.reps,
      weightKg: input.weightKg,
      rpe: null,
      type: 'normal',
      completed: false,
      durationSeconds: null,
      distanceM: null,
    })),
    updateSet: vi.fn<WorkoutRepository['updateSet']>().mockResolvedValue(),
    removeSet: vi.fn<WorkoutRepository['removeSet']>().mockResolvedValue(),
    ...overrides,
  }
}

describe('offline workout repository', () => {
  let queue: ReturnType<typeof createOpQueue>

  beforeEach(async () => {
    queue = createOpQueue()
    await queue.clear()
    setOnline(true)
  })
  afterEach(() => setOnline(true))

  it('passes writes through while online', async () => {
    const inner = innerRepo()
    const repo = createOfflineWorkoutRepository(inner, queue)
    await repo.updateSet('s1', { completed: true })
    expect(inner.updateSet).toHaveBeenCalledWith('s1', { completed: true })
    expect(await queue.size()).toBe(0)
  })

  it('queues writes while offline and returns locally usable values', async () => {
    const inner = innerRepo()
    const repo = createOfflineWorkoutRepository(inner, queue)
    setOnline(false)

    const workout = await repo.start({ name: 'Libre' })
    const weId = await repo.addExercise(workout.id, 'bench', 0)
    const set = await repo.addSet(weId, 0, { reps: 8, weightKg: 80 })
    await repo.updateSet(set.id, { completed: true })

    expect(inner.start).not.toHaveBeenCalled()
    expect(inner.addSet).not.toHaveBeenCalled()
    expect(workout.id).toMatch(/[0-9a-f-]{36}/)
    expect(set.id).toMatch(/[0-9a-f-]{36}/)
    expect(repo.pending.value).toBe(4)
  })

  it('replays the queue in order when the connection returns', async () => {
    const inner = innerRepo()
    const repo = createOfflineWorkoutRepository(inner, queue)
    setOnline(false)
    const workout = await repo.start({ name: 'Libre' })
    const weId = await repo.addExercise(workout.id, 'bench', 0)
    const set = await repo.addSet(weId, 0, { reps: 8, weightKg: 80 })
    await repo.updateSet(set.id, { completed: true })

    setOnline(true)
    await repo.flush()

    expect(inner.start).toHaveBeenCalledWith({ name: 'Libre', id: workout.id })
    expect(inner.addExercise).toHaveBeenCalledWith(workout.id, 'bench', 0, weId)
    expect(inner.addSet).toHaveBeenCalledWith(weId, 0, { reps: 8, weightKg: 80 }, set.id)
    expect(inner.updateSet).toHaveBeenCalledWith(set.id, { completed: true })
    expect(await queue.size()).toBe(0)
    expect(repo.pending.value).toBe(0)
  })

  it('queues when a request fails with a network error while nominally online', async () => {
    const inner = innerRepo({
      updateSet: vi
        .fn<WorkoutRepository['updateSet']>()
        .mockRejectedValue(new Error('Failed to fetch')),
    })
    const repo = createOfflineWorkoutRepository(inner, queue)
    await repo.updateSet('s1', { reps: 5 })
    expect(await queue.size()).toBe(1)
  })

  it('propagates server rejections instead of queueing them', async () => {
    const inner = innerRepo({
      updateSet: vi
        .fn<WorkoutRepository['updateSet']>()
        .mockRejectedValue(new Error('row level security')),
    })
    const repo = createOfflineWorkoutRepository(inner, queue)
    await expect(repo.updateSet('s1', { reps: 5 })).rejects.toThrow('row level security')
    expect(await queue.size()).toBe(0)
  })

  it('drops a rejected operation during replay so the queue keeps moving', async () => {
    const inner = innerRepo()
    const repo = createOfflineWorkoutRepository(inner, queue)
    setOnline(false)
    await repo.updateSet('bad', { reps: 1 })
    await repo.updateSet('good', { reps: 2 })
    setOnline(true)

    const failing = vi
      .fn<WorkoutRepository['updateSet']>()
      .mockRejectedValueOnce(new Error('invalid input syntax'))
      .mockResolvedValue()
    inner.updateSet = failing
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await repo.flush()
    expect(failing).toHaveBeenCalledTimes(2)
    expect(await queue.size()).toBe(0)
  })

  it('stops replaying at the first network failure and keeps the rest queued', async () => {
    const inner = innerRepo()
    const repo = createOfflineWorkoutRepository(inner, queue)
    setOnline(false)
    await repo.updateSet('a', { reps: 1 })
    await repo.updateSet('b', { reps: 2 })
    setOnline(true)

    inner.updateSet = vi
      .fn<WorkoutRepository['updateSet']>()
      .mockRejectedValue(new Error('Failed to fetch'))
    await repo.flush()
    expect(await queue.size()).toBe(2)
  })
})
