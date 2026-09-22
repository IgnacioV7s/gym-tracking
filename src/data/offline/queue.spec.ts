import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createOpQueue } from './queue'

describe('op queue', () => {
  let queue: ReturnType<typeof createOpQueue>

  beforeEach(async () => {
    queue = createOpQueue()
    await queue.clear()
  })

  it('keeps insertion order and survives a new handle on the same database', async () => {
    await queue.enqueue('addSet', ['we1', 0, { reps: 8 }])
    await queue.enqueue('updateSet', ['s1', { completed: true }])
    expect(await queue.size()).toBe(2)

    const reopened = createOpQueue()
    const ops = await reopened.list()
    expect(ops.map((o) => o.method)).toEqual(['addSet', 'updateSet'])
    expect(ops[0]?.args).toEqual(['we1', 0, { reps: 8 }])
    expect(ops[0]?.seq).toBeLessThan(ops[1]!.seq!)
  })

  it('removes entries by sequence and clears', async () => {
    await queue.enqueue('a', [])
    await queue.enqueue('b', [])
    const [first] = await queue.list()
    await queue.remove(first!.seq!)
    expect((await queue.list()).map((o) => o.method)).toEqual(['b'])
    await queue.clear()
    expect(await queue.size()).toBe(0)
  })
})

describe('op queue without IndexedDB', () => {
  it('degrades to a no-op instead of throwing', async () => {
    const original = globalThis.indexedDB
    // @ts-expect-error simulating a runtime where the API is missing
    delete globalThis.indexedDB
    try {
      const queue = createOpQueue()
      await expect(queue.enqueue('addSet', [])).resolves.toBeUndefined()
      await expect(queue.list()).resolves.toEqual([])
      await expect(queue.size()).resolves.toBe(0)
    } finally {
      globalThis.indexedDB = original
    }
  })
})
