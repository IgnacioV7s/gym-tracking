import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useRestAlert } from './useRestAlert'

describe('useRestAlert', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', undefined)
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn<() => boolean>(),
      configurable: true,
    })
  })

  it('vibrates once per expiration', async () => {
    const expirations = ref(0)
    const scope = effectScope()
    scope.run(() => useRestAlert(expirations, () => 'done'))
    expirations.value += 1
    await nextTick()
    expirations.value += 1
    await nextTick()
    expect(navigator.vibrate).toHaveBeenCalledTimes(2)
    scope.stop()
  })
})
