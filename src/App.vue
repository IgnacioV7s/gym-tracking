<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOnline } from '@vueuse/core'
import { WifiOff, RefreshCw } from '@lucide/vue'
import { Toaster } from '@/components/ui/sonner'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useExercisesStore } from '@/stores/exercises'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { useRoutinesStore } from '@/stores/routines'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStreakStore } from '@/stores/streak'
import { offlineWorkouts } from '@/data/repositories'

const { t } = useI18n()
const online = useOnline()
const pending = offlineWorkouts.pending
const TAB_ORDER = ['home', 'history', 'routines', 'analytics']
const transitionName = ref('fade')
const route = useRoute()

// Slide between bottom-nav tabs in the direction they sit; everything else fades.
watch(
  () => route.name,
  (to, from) => {
    const a = TAB_ORDER.indexOf(String(from))
    const b = TAB_ORDER.indexOf(String(to))
    transitionName.value =
      a !== -1 && b !== -1 && a !== b ? (b > a ? 'slide-left' : 'slide-right') : 'fade'
  },
)
const auth = useAuthStore()
const profileStore = useProfileStore()
const exercisesStore = useExercisesStore()
const activeWorkout = useActiveWorkoutStore()
const routinesStore = useRoutinesStore()
const workoutsStore = useWorkoutsStore()
const streakStore = useStreakStore()

const showNav = computed(() => !route.meta.public)

watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) {
      void profileStore.load().then(() => {
        // A persisted session whose user no longer exists (e.g. the database
        // was reset) has no profile row: drop it instead of hanging forever.
        if (!profileStore.profile) void auth.signOut()
      })
    } else {
      profileStore.reset()
      exercisesStore.reset()
      activeWorkout.reset()
      routinesStore.reset()
      workoutsStore.reset()
      streakStore.reset()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="!online || pending > 0"
    role="status"
    class="flex items-center justify-center gap-2 px-4 py-2 text-center text-sm text-white"
    :class="online ? 'bg-primary' : 'bg-destructive'"
  >
    <RefreshCw v-if="online" class="size-4 animate-spin" aria-hidden="true" />
    <WifiOff v-else class="size-4" aria-hidden="true" />
    <span>
      <template v-if="online">{{ t('common.syncing', { n: pending }) }}</template>
      <template v-else-if="pending > 0">{{ t('common.offlinePending', { n: pending }) }}</template>
      <template v-else>{{ t('common.offline') }}</template>
      <span v-if="!online" class="hidden sm:inline"> · {{ t('common.offlineHint') }}</span>
    </span>
  </div>
  <main class="mx-auto max-w-xl p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+1rem)]">
    <!-- Views render fragments, so the transition needs a single wrapper node. -->
    <RouterView v-slot="{ Component, route: current }">
      <Transition :name="transitionName" mode="out-in">
        <div :key="current.path">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
  </main>
  <BottomNav v-if="showNav" />
  <Toaster position="top-center" />
</template>
