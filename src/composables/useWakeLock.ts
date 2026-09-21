import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Keeps the screen on while `active` is true (Screen Wake Lock API). Silently
 * does nothing where unsupported; re-acquires when the tab becomes visible.
 */
export function useWakeLock(active: Ref<boolean>) {
  const held = ref(false)
  let sentinel: WakeLockSentinel | null = null

  async function acquire() {
    if (sentinel || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      held.value = true
      sentinel.addEventListener('release', () => {
        sentinel = null
        held.value = false
      })
    } catch {
      held.value = false
    }
  }

  async function release() {
    await sentinel?.release()
    sentinel = null
    held.value = false
  }

  function onVisibility() {
    if (active.value && document.visibilityState === 'visible') void acquire()
  }

  watch(active, (on) => (on ? void acquire() : void release()), { immediate: true })
  document.addEventListener('visibilitychange', onVisibility)
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    void release()
  })

  return { held }
}
