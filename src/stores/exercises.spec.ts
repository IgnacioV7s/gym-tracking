import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Exercise } from '@/domain/models'
import type { ExerciseRepository } from '@/domain/repositories'

vi.mock('@/data/repositories', () => ({ repositories: {} }))

import { createExercisesStore } from './exercises'

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: 'x',
    userId: null,
    name: 'X',
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'other',
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function mockRepo(): ExerciseRepository {
  return {
    list: vi
      .fn<ExerciseRepository['list']>()
      .mockResolvedValue([
        exercise({ id: 'b', name: 'Sentadilla' }),
        exercise({ id: 'a', name: 'Press', archivedAt: '2026-01-02T00:00:00Z' }),
      ]),
    create: vi.fn<ExerciseRepository['create']>(async (input) =>
      exercise({ id: 'new', userId: 'u1', ...input }),
    ),
    update: vi.fn<ExerciseRepository['update']>(async (id, input) =>
      exercise({ id, userId: 'u1', ...input }),
    ),
    archive: vi.fn<ExerciseRepository['archive']>(async (id) =>
      exercise({ id, archivedAt: '2026-01-03T00:00:00Z' }),
    ),
    unarchive: vi.fn<ExerciseRepository['unarchive']>(async (id) => exercise({ id })),
  }
}

describe('exercises store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('loads once and exposes active items and a lookup map', async () => {
    const repo = mockRepo()
    const store = createExercisesStore(repo)()
    await store.load()
    await store.load()
    expect(repo.list).toHaveBeenCalledTimes(1)
    expect(store.items).toHaveLength(2)
    expect(store.active.map((e) => e.id)).toEqual(['b'])
    expect(store.byId.get('a')?.name).toBe('Press')
  })

  it('inserts created exercises keeping alphabetical order', async () => {
    const store = createExercisesStore(mockRepo())()
    await store.load()
    await store.create({
      name: 'Curl',
      primaryMuscle: 'biceps',
      secondaryMuscles: [],
      equipment: 'dumbbell',
    })
    expect(store.items.map((e) => e.name)).toEqual(['Curl', 'Press', 'Sentadilla'])
  })

  it('archives and unarchives in place', async () => {
    const store = createExercisesStore(mockRepo())()
    await store.load()
    await store.archive('b')
    expect(store.active).toHaveLength(0)
    await store.unarchive('a')
    expect(store.active.map((e) => e.id)).toEqual(['a'])
  })

  it('records errors from the repository', async () => {
    const repo = mockRepo()
    repo.list = vi.fn<ExerciseRepository['list']>().mockRejectedValue(new Error('boom'))
    const store = createExercisesStore(repo)()
    await store.load()
    expect(store.error).toBe('boom')
    expect(store.loaded).toBe(false)
  })
})
