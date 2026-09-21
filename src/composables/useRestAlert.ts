import { watch, type Ref } from 'vue'

/** Short beep through the Web Audio API; no asset needed. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
    osc.onended = () => void ctx.close()
  } catch {
    /* audio blocked; vibration/notification still fire */
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') return
  try {
    await Notification.requestPermission()
  } catch {
    /* ignore */
  }
}

/** Sound, vibration and (when allowed and the tab is hidden) a notification each time the timer expires. */
export function useRestAlert(expirations: Ref<number>, message: () => string) {
  watch(expirations, () => {
    beep()
    navigator.vibrate?.([200, 100, 200])
    if (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      try {
        new Notification(message(), { tag: 'rest-timer' })
      } catch {
        /* ignore */
      }
    }
  })
}
