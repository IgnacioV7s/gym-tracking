import { computed, ref } from 'vue'
import { endOfDay, startOfDay } from 'date-fns'
import { periodFor, previousPeriod, type Period, type PeriodPreset } from '@/domain/analytics'

/** Period selector state: preset + offset (0 = current), or a custom range. */
export function usePeriod(initial: PeriodPreset = 'month') {
  const preset = ref<PeriodPreset>(initial)
  const offset = ref(0)
  const customFrom = ref<Date>(startOfDay(new Date()))
  const customTo = ref<Date>(endOfDay(new Date()))

  const period = computed<Period>(() =>
    preset.value === 'custom'
      ? { from: startOfDay(customFrom.value), to: endOfDay(customTo.value) }
      : periodFor(preset.value, new Date(), offset.value),
  )

  const previous = computed(() => previousPeriod(period.value))

  function setPreset(next: PeriodPreset) {
    preset.value = next
    offset.value = 0
  }

  function shift(delta: number) {
    if (preset.value === 'custom') return
    offset.value = Math.max(0, offset.value + delta)
  }

  function setCustom(from: Date, to: Date) {
    customFrom.value = from
    customTo.value = to
    preset.value = 'custom'
  }

  return { preset, offset, period, previous, setPreset, shift, setCustom }
}
