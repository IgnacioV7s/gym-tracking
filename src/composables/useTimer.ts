import { computed, onScopeDispose, ref } from 'vue'

/** Countdown timer driven by wall-clock time so it stays accurate in background tabs. */
export function useTimer() {
  const endsAt = ref<number | null>(null)
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const remaining = computed(() =>
    endsAt.value === null ? 0 : Math.max(0, Math.ceil((endsAt.value - now.value) / 1000)),
  )
  const running = computed(() => endsAt.value !== null && remaining.value > 0)

  function tick() {
    now.value = Date.now()
    if (endsAt.value !== null && now.value >= endsAt.value) stopInterval()
  }

  function stopInterval() {
    if (interval) clearInterval(interval)
    interval = null
  }

  function start(seconds: number) {
    now.value = Date.now()
    endsAt.value = now.value + seconds * 1000
    stopInterval()
    interval = setInterval(tick, 250)
  }

  function add(seconds: number) {
    if (endsAt.value === null) return
    endsAt.value = Math.max(Date.now(), endsAt.value) + seconds * 1000
    if (!interval) interval = setInterval(tick, 250)
    tick()
  }

  function stop() {
    endsAt.value = null
    stopInterval()
  }

  onScopeDispose(stopInterval)

  return { remaining, running, start, add, stop }
}
