<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { motion, DURATION, EASE, prefersReducedMotion } from '@/lib/motion'

const props = defineProps<{ remaining: number; running: boolean; total?: number }>()
const emit = defineEmits<{ add: [seconds: number]; stop: [] }>()
const { t } = useI18n()

const RADIUS = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const root = ref<HTMLElement | null>(null)

const label = computed(() => {
  const m = Math.floor(props.remaining / 60)
  const s = props.remaining % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const dashOffset = computed(() => {
  const total = props.total || 1
  const progress = Math.max(0, Math.min(1, props.remaining / total))
  return CIRCUMFERENCE * (1 - progress)
})

// Last seconds: a small nudge so it registers without staring at the phone.
watch(
  () => props.remaining,
  (left) => {
    if (!root.value || !props.running || left > 3 || left <= 0 || prefersReducedMotion()) return
    motion(root.value, { translateX: [0, -3, 3, 0], duration: DURATION.base, ease: EASE.inOut })
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="running"
      ref="root"
      role="timer"
      aria-live="off"
      :aria-label="t('workout.rest.label')"
      class="fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-20 mx-auto flex max-w-xl items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg"
    >
      <span class="relative grid size-10 shrink-0 place-items-center">
        <svg class="size-10 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" :r="RADIUS" fill="none" stroke="var(--muted)" stroke-width="3" />
          <circle
            cx="20"
            cy="20"
            :r="RADIUS"
            fill="none"
            stroke="var(--primary)"
            stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            class="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
      </span>
      <span class="text-sm text-muted-foreground">{{ t('workout.rest.label') }}</span>
      <span class="flex-1 text-center font-mono text-2xl font-semibold tabular-nums">
        {{ label }}
      </span>
      <Button
        variant="outline"
        size="sm"
        :aria-label="t('workout.rest.add30')"
        @click="emit('add', 30)"
      >
        <Plus class="size-4" />
        30s
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('workout.rest.skip')"
        @click="emit('stop')"
      >
        <X class="size-4" />
      </Button>
    </div>
  </Transition>
</template>
