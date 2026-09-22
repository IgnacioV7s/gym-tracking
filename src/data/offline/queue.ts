/**
 * Durable queue of pending writes, kept in IndexedDB so a closed tab (or a
 * phone locking mid-set) does not lose anything. Entries are replayed in
 * insertion order; every operation carries client-generated ids, so replaying
 * produces exactly the same rows the optimistic UI already shows.
 */
export interface QueuedOp {
  /** Monotonic key assigned by IndexedDB. */
  seq?: number
  /** Repository method to call. */
  method: string
  args: unknown[]
  queuedAt: string
}

const DB_NAME = 'gym-tracking-offline'
const STORE = 'pending-ops'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'seq', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function createOpQueue() {
  let dbPromise: Promise<IDBDatabase> | null = null
  const db = () => (dbPromise ??= openDb())

  return {
    async enqueue(method: string, args: unknown[]): Promise<void> {
      const conn = await db()
      const tx = conn.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).add({ method, args, queuedAt: new Date().toISOString() })
      await done(tx)
    },

    async list(): Promise<QueuedOp[]> {
      const conn = await db()
      const tx = conn.transaction(STORE, 'readonly')
      return promisify(tx.objectStore(STORE).getAll() as IDBRequest<QueuedOp[]>)
    },

    async remove(seq: number): Promise<void> {
      const conn = await db()
      const tx = conn.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(seq)
      await done(tx)
    },

    async clear(): Promise<void> {
      const conn = await db()
      const tx = conn.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      await done(tx)
    },

    async size(): Promise<number> {
      const conn = await db()
      const tx = conn.transaction(STORE, 'readonly')
      return promisify(tx.objectStore(STORE).count())
    },
  }
}

export type OpQueue = ReturnType<typeof createOpQueue>
