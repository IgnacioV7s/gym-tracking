<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dumbbell, ClipboardList, CheckSquare, TrendingUp } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; finish: [] }>()

const { t, tm } = useI18n()
const ICONS = [Dumbbell, ClipboardList, CheckSquare, TrendingUp]

const steps = computed(() => {
  const raw = tm('onboarding.steps') as unknown
  return Array.isArray(raw) ? (raw as { title: string; body: string }[]) : []
})
const index = ref(0)
const isLast = computed(() => index.value >= steps.value.length - 1)
const step = computed(() => steps.value[index.value])

watch(
  () => props.open,
  (open) => {
    if (open) index.value = 0
  },
)

function close() {
  emit('finish')
  emit('update:open', false)
}

function next() {
  if (isLast.value) close()
  else index.value += 1
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('onboarding.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('onboarding.stepOf', { n: index + 1, total: steps.length }) }}
        </DialogDescription>
      </DialogHeader>

      <section v-if="step" class="grid gap-3" :aria-label="step.title">
        <component :is="ICONS[index] ?? Dumbbell" class="size-10 text-primary" aria-hidden="true" />
        <h3 class="text-lg font-semibold">{{ step.title }}</h3>
        <p class="text-sm text-muted-foreground">{{ step.body }}</p>
      </section>

      <ol class="flex justify-center gap-1.5" aria-hidden="true">
        <li
          v-for="(_, i) in steps"
          :key="i"
          class="h-1.5 w-6 rounded-full"
          :class="i === index ? 'bg-primary' : 'bg-muted'"
        />
      </ol>

      <DialogFooter class="flex-row justify-between sm:justify-between">
        <Button variant="ghost" @click="close">{{ t('onboarding.skip') }}</Button>
        <Button @click="next">{{ isLast ? t('onboarding.done') : t('onboarding.next') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
