import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import { useTimer } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts down from the given seconds and stops at zero', () => {
    const scope = effectScope()
    const timer = scope.run(() => useTimer())!
    timer.start(3)
    expect(timer.remaining.value).toBe(3)
    expect(timer.running.value).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(timer.remaining.value).toBe(2)
    vi.advanceTimersByTime(2500)
    expect(timer.remaining.value).toBe(0)
    expect(timer.running.value).toBe(false)
    expect(timer.expirations.value).toBe(1)
    scope.stop()
  })

  it('adds time and can be stopped', () => {
    const scope = effectScope()
    const timer = scope.run(() => useTimer())!
    timer.start(10)
    vi.advanceTimersByTime(4000)
    timer.add(30)
    expect(timer.remaining.value).toBe(36)
    timer.stop()
    expect(timer.remaining.value).toBe(0)
    expect(timer.running.value).toBe(false)
    expect(timer.expirations.value).toBe(0)
    scope.stop()
  })
})
