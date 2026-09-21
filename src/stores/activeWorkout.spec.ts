import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Workout, WorkoutSet } from '@/domain/models'
import type { WorkoutRepository } from '@/domain/repositories'

vi.mock('@/data/repositories', () => ({ repositories: {} }))

import { createActiveWorkoutStore } from './activeWorkout'

let seq = 0
function nextId(prefix: string) {
  seq += 1
  return `${prefix}${seq}`
}

function makeRepo(previous: Workout[] = []) {
  const repo: WorkoutRepository = {
    listBetween: vi.fn<WorkoutRepository['listBetween']>().mockResolvedValue([]),
    get: vi.fn<WorkoutRepository['get']>().mockResolvedValue(null),
    getActive: vi.fn<WorkoutRepository['getActive']>().mockResolvedValue(null),
    getLastFinished: vi.fn<WorkoutRepository['getLastFinished']>().mockResolvedValue(null),
    setExercisePositions: vi.fn<WorkoutRepository['setExercisePositions']>().mockResolvedValue(),
    listByExercise: vi.fn<WorkoutRepository['listByExercise']>().mockResolvedValue(previous),
    start: vi.fn<WorkoutRepository['start']>(async ({ name, routineId }) => ({
      id: nextId('w'),
      routineId: routineId ?? null,
      name,
      startedAt: '2026-01-01T10:00:00Z',
      finishedAt: null,
      notes: null,
      exercises: [],
    })),
    updateMeta: vi.fn<WorkoutRepository['updateMeta']>().mockResolvedValue(),
    finish: vi.fn<WorkoutRepository['finish']>().mockResolvedValue(),
    remove: vi.fn<WorkoutRepository['remove']>().mockResolvedValue(),
    addExercise: vi.fn<WorkoutRepository['addExercise']>(async () => nextId('we')),
    removeExercise: vi.fn<WorkoutRepository['removeExercise']>().mockResolvedValue(),
    updateExerciseNotes: vi.fn<WorkoutRepository['updateExerciseNotes']>().mockResolvedValue(),
    addSet: vi.fn<WorkoutRepository['addSet']>(async (_weId, position, input) => ({
      id: nextId('s'),
      position,
      reps: input.reps,
      weightKg: input.weightKg,
      rpe: input.rpe ?? null,
      type: input.type ?? 'normal',
      completed: input.completed ?? false,
      durationSeconds: input.durationSeconds ?? null,
      distanceM: input.distanceM ?? null,
    })),
    updateSet: vi.fn<WorkoutRepository['updateSet']>().mockResolvedValue(),
    removeSet: vi.fn<WorkoutRepository['removeSet']>().mockResolvedValue(),
  }
  return repo
}

function prevSet(position: number, reps: number, weightKg: number): WorkoutSet {
  return {
    id: `p${position}`,
    position,
    reps,
    weightKg,
    rpe: null,
    type: 'normal',
    completed: true,
    durationSeconds: null,
    distanceM: null,
  }
}

const previousSession: Workout = {
  id: 'old',
  routineId: null,
  name: 'old',
  startedAt: '2025-12-30T10:00:00Z',
  finishedAt: '2025-12-30T11:00:00Z',
  notes: null,
  exercises: [
    {
      id: 'oe',
      exerciseId: 'bench',
      position: 0,
      notes: null,
      sets: [prevSet(0, 8, 80), prevSet(1, 8, 82.5)],
    },
  ],
}

describe('activeWorkout store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    seq = 0
  })
  afterEach(() => vi.useRealTimers())

  it('starts a free session and adds an exercise with a first set from last session', async () => {
    const repo = makeRepo([previousSession])
    const store = createActiveWorkoutStore(repo)()
    await store.start('Libre')
    expect(store.isActive).toBe(true)

    await store.addExercise('bench')
    // loadPrevious is fire-and-forget; addSet awaited repo but previous may not be loaded yet.
    await vi.runAllTimersAsync()
    const exercise = store.workout!.exercises[0]!
    expect(exercise.sets).toHaveLength(1)
    expect(store.previousSet('bench', 1)).toMatchObject({ reps: 8, weightKg: 82.5 })
  })

  it('copies the last set when adding another one', async () => {
    const store = createActiveWorkoutStore(makeRepo())()
    await store.start('Libre')
    await store.addExercise('bench')
    const weId = store.workout!.exercises[0]!.id
    store.updateSet(store.workout!.exercises[0]!.sets[0]!.id, { reps: 5, weightKg: 100 })
    await store.addSet(weId)
    expect(store.workout!.exercises[0]!.sets[1]).toMatchObject({
      reps: 5,
      weightKg: 100,
      position: 1,
    })
  })

  it('debounces set edits into a single merged update', async () => {
    const repo = makeRepo()
    const store = createActiveWorkoutStore(repo)()
    await store.start('Libre')
    await store.addExercise('bench')
    const setId = store.workout!.exercises[0]!.sets[0]!.id

    store.updateSet(setId, { reps: 6 })
    store.updateSet(setId, { reps: 7 })
    store.updateSet(setId, { weightKg: 90 })
    expect(repo.updateSet).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(600)
    expect(repo.updateSet).toHaveBeenCalledTimes(1)
    expect(repo.updateSet).toHaveBeenCalledWith(setId, { reps: 7, weightKg: 90 })
    expect(store.saveStatus).toBe('saved')
  })

  it('persists completion immediately and flushes pending edits first', async () => {
    const repo = makeRepo()
    const store = createActiveWorkoutStore(repo)()
    await store.start('Libre')
    await store.addExercise('bench')
    const setId = store.workout!.exercises[0]!.sets[0]!.id

    store.updateSet(setId, { reps: 9 })
    const completed = await store.toggleCompleted(setId)
    expect(completed).toBe(true)
    expect(repo.updateSet).toHaveBeenNthCalledWith(1, setId, { reps: 9 })
    expect(repo.updateSet).toHaveBeenNthCalledWith(2, setId, { completed: true })
  })

  it('reports save errors', async () => {
    const repo = makeRepo()
    repo.updateSet = vi.fn<WorkoutRepository['updateSet']>().mockRejectedValue(new Error('offline'))
    const store = createActiveWorkoutStore(repo)()
    await store.start('Libre')
    await store.addExercise('bench')
    await store.toggleCompleted(store.workout!.exercises[0]!.sets[0]!.id)
    expect(store.saveStatus).toBe('error')
  })

  it('finishes the session, returning the finished workout', async () => {
    const repo = makeRepo()
    const store = createActiveWorkoutStore(repo)()
    await store.start('Libre')
    const finished = await store.finish()
    expect(finished?.finishedAt).toBeTruthy()
    expect(repo.finish).toHaveBeenCalledWith('w1', finished!.finishedAt)
    expect(store.isActive).toBe(false)
  })

  it('pre-fills sets from a routine using last session weights', async () => {
    const repo = makeRepo([previousSession])
    const store = createActiveWorkoutStore(repo)()
    await store.startFromRoutine({
      id: 'r1',
      name: 'Push',
      notes: null,
      createdAt: '',
      updatedAt: '',
      exercises: [
        {
          id: 're1',
          exerciseId: 'bench',
          position: 0,
          targetSets: 3,
          targetReps: 8,
          targetWeightKg: 70,
          restSeconds: null,
        },
        {
          id: 're2',
          exerciseId: 'squat',
          position: 1,
          targetSets: 2,
          targetReps: 5,
          targetWeightKg: null,
          restSeconds: 180,
        },
      ],
    })
    const [bench, squat] = store.workout!.exercises
    expect(bench!.sets.map((s) => [s.reps, s.weightKg])).toEqual([
      [8, 80],
      [8, 82.5],
      [8, 70],
    ])
    expect(squat!.sets.map((s) => [s.reps, s.weightKg])).toEqual([
      [5, 0],
      [5, 0],
    ])
    expect(store.workout!.routineId).toBe('r1')
  })
})
