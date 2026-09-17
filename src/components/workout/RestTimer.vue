<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ remaining: number; running: boolean }>()
const emit = defineEmits<{ add: [seconds: number]; stop: [] }>()
const { t } = useI18n()

const label = computed(() => {
  const m = Math.floor(props.remaining / 60)
  const s = props.remaining % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
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
      role="timer"
      aria-live="off"
      :aria-label="t('workout.rest.label')"
      class="fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-20 mx-auto flex max-w-xl items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg"
    >
      <span class="text-sm text-muted-foreground">{{ t('workout.rest.label') }}</span>
      <span class="flex-1 text-center font-mono text-2xl font-semibold tabular-nums">{{
        label
      }}</span>
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
