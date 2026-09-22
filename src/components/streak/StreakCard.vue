<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Flame, BedDouble, X } from '@lucide/vue'
import { useStreakStore } from '@/stores/streak'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, countUp, DURATION, EASE, prefersReducedMotion } from '@/lib/motion'

const { t } = useI18n()
const store = useStreakStore()
const busy = ref(false)
const flame = ref<HTMLElement | null>(null)
const headlineEl = ref<HTMLElement | null>(null)

onMounted(() => store.load())

const streak = computed(() => store.streak)
const headline = computed(() => {
  const n = streak.value.current
  if (n === 0) return t('streak.none')
  return n === 1 ? t('streak.daysOne') : t('streak.days', { n })
})
/** Headline split around the number so the count can animate in place. */
const headlineParts = computed(() => {
  const n = String(streak.value.current)
  const at = headline.value.indexOf(n)
  if (at === -1) return null
  return { before: headline.value.slice(0, at), after: headline.value.slice(at + n.length) }
})

// The flame breathes while a streak is alive and kicks when it grows.
watch(
  () => [store.loaded, streak.value.current, streak.value.atRisk] as const,
  ([loaded, current, atRisk], previous) => {
    const el = flame.value
    if (!loaded || !el) return
    if (previous && current > Number(previous[1])) {
      motion(el, {
        scale: [1, 1.35, 1],
        rotate: [0, -8, 6, 0],
        duration: DURATION.slow,
        ease: EASE.spring,
      })
    }
    if (current > 0 && !atRisk && !prefersReducedMotion()) {
      motion(el, { scale: [1, 1.08, 1], duration: 1800, ease: EASE.inOut, loop: true })
    }
  },
  { flush: 'post' },
)

watch(
  () => [store.loaded, streak.value.current] as const,
  ([loaded, current], previous) => {
    if (!loaded || current === 0) return
    const el = headlineEl.value?.querySelector('[data-count]')
    if (el instanceof HTMLElement) {
      countUp(el, current, { from: previous ? Number(previous[1]) : 0, duration: DURATION.base })
    }
  },
  { flush: 'post' },
)

async function toggleRest() {
  busy.value = true
  try {
    if (streak.value.today === 'rest') {
      await store.unmarkRest()
      toast(t('streak.restRemoved'))
    } else {
      await store.markRest()
      toast.success(t('streak.restMarked'))
    }
  } catch (e) {
    toast.error(t('common.couldNotSave'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Card :aria-label="t('streak.title')" data-testid="streak-card">
    <CardContent class="flex items-center gap-3">
      <Flame
        ref="flame"
        class="size-8 shrink-0"
        :class="streak.current > 0 && !streak.atRisk ? 'text-orange-500' : 'text-muted-foreground'"
        aria-hidden="true"
      />
      <div v-if="!store.loaded" class="flex-1">
        <Skeleton class="h-5 w-40" />
      </div>
      <div v-else ref="headlineEl" class="min-w-0 flex-1">
        <p class="font-semibold">
          <template v-if="streak.current > 0 && headlineParts">
            {{ headlineParts.before
            }}<span data-count class="tabular-nums">{{ streak.current }}</span
            >{{ headlineParts.after }}
          </template>
          <template v-else>{{ headline }}</template>
        </p>
        <p class="text-xs text-muted-foreground">
          <template v-if="streak.today === 'trained'">{{ t('streak.trainedToday') }}</template>
          <template v-else-if="streak.today === 'rest'">{{ t('streak.restToday') }}</template>
          <template v-else-if="streak.atRisk">{{ t('streak.atRisk') }}</template>
          <template v-else-if="streak.best > 0">
            {{ t('streak.best', { n: streak.best }) }}
          </template>
        </p>
      </div>
      <Button
        v-if="store.loaded && streak.today !== 'trained'"
        variant="outline"
        size="sm"
        :disabled="busy"
        @click="toggleRest"
      >
        <X v-if="streak.today === 'rest'" class="size-4" />
        <BedDouble v-else class="size-4" />
        {{ streak.today === 'rest' ? t('streak.unmarkRest') : t('streak.markRest') }}
      </Button>
    </CardContent>
  </Card>
</template>
