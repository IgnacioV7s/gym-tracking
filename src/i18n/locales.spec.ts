import { describe, it, expect } from 'vitest'
import es from './locales/es.json'
import en from './locales/en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('locales', () => {
  it('es and en define exactly the same keys', () => {
    const esKeys = flatten(es).sort()
    const enKeys = flatten(en).sort()
    expect(enKeys).toEqual(esKeys)
  })

  it('has no empty messages', () => {
    for (const messages of [es, en]) {
      const empty = flatten(messages).filter((k) => {
        const value = k
          .split('.')
          .reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], messages)
        return typeof value !== 'string' || value.trim() === ''
      })
      expect(empty).toEqual([])
    }
  })
})
