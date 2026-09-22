import { describe, it, expect, vi, beforeEach } from 'vitest'
import { countUp, motion, prefersReducedMotion } from './motion'

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
  }))
}

describe('motion helpers', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('detects the reduced-motion preference', () => {
    setReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
    setReducedMotion(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('applies the final value instantly under reduced motion', () => {
    setReducedMotion(true)
    const el = document.createElement('div')
    document.body.append(el)
    const onComplete = vi.fn<() => void>()
    expect(motion(el, { opacity: [0, 1], duration: 400, onComplete })).toBeNull()
    expect(el.style.opacity).toBe('1')
    expect(onComplete).toHaveBeenCalledOnce()
    el.remove()
  })

  it('countUp writes the final formatted value immediately under reduced motion', () => {
    setReducedMotion(true)
    const el = document.createElement('span')
    expect(countUp(el, 1280, { format: (v) => `${Math.round(v)} kg` })).toBeNull()
    expect(el.textContent).toBe('1280 kg')
  })

  it('countUp animates toward the target otherwise', async () => {
    setReducedMotion(false)
    const el = document.createElement('span')
    const animation = countUp(el, 100, { duration: 40 })
    expect(animation).not.toBeNull()
    await animation!.then?.(() => undefined)
    expect(el.textContent).toBe('100')
  })
})
