import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Routine, RoutineInput } from '@/domain/models'
import type { RoutineRepository } from '@/domain/repositories'

vi.mock('@/data/repositories', () => ({ repositories: {} }))
vi.mock('@/i18n', () => ({
  i18n: { global: { t: (k: string) => (k === 'routines.copySuffix' ? '(copia)' : k) } },
}))

import { createRoutinesStore } from './routines'

let seq = 0
function fromInput(id: string, input: RoutineInput): Routine {
  return {
    id,
    name: input.name,
    notes: input.notes ?? null,
    createdAt: 'c',
    updatedAt: 'u',
    exercises: input.exercises.map((e, position) => ({
      id: `${id}-${position}`,
      exerciseId: e.exerciseId,
      position,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeightKg: e.targetWeightKg ?? null,
      restSeconds: e.restSeconds ?? null,
    })),
  }
}

const push = fromInput('r1', {
  name: 'Push',
  exercises: [{ exerciseId: 'bench', targetSets: 3, targetReps: 8, targetWeightKg: 80 }],
})

function mockRepo(): RoutineRepository {
  return {
    list: vi.fn<RoutineRepository['list']>().mockResolvedValue([push]),
    get: vi.fn<RoutineRepository['get']>().mockResolvedValue(null),
    create: vi.fn<RoutineRepository['create']>(async (input) => fromInput(`new${++seq}`, input)),
    update: vi.fn<RoutineRepository['update']>(async (id, input) => fromInput(id, input)),
    remove: vi.fn<RoutineRepository['remove']>().mockResolvedValue(),
  }
}

describe('routines store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    seq = 0
  })

  it('loads and updates in place, moving updated routines to the top', async () => {
    const store = createRoutinesStore(mockRepo())()
    await store.load()
    await store.create({
      name: 'Pull',
      exercises: [{ exerciseId: 'row', targetSets: 3, targetReps: 10 }],
    })
    expect(store.items.map((r) => r.name)).toEqual(['Pull', 'Push'])
    await store.update('r1', { name: 'Push v2', exercises: push.exercises })
    expect(store.items.map((r) => r.name)).toEqual(['Push v2', 'Pull'])
  })

  it('duplicates a routine copying its exercises', async () => {
    const repo = mockRepo()
    const store = createRoutinesStore(repo)()
    await store.load()
    const copy = await store.duplicate('r1')
    expect(copy.name).toBe('Push (copia)')
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Push (copia)',
      notes: null,
      exercises: [
        {
          exerciseId: 'bench',
          targetSets: 3,
          targetReps: 8,
          targetWeightKg: 80,
          restSeconds: null,
        },
      ],
    })
  })

  it('removes a routine', async () => {
    const store = createRoutinesStore(mockRepo())()
    await store.load()
    await store.remove('r1')
    expect(store.items).toHaveLength(0)
  })
})
