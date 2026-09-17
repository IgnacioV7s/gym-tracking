<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useExercisesStore } from '@/stores/exercises'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { useRoutinesStore } from '@/stores/routines'
import { useWorkoutsStore } from '@/stores/workouts'

const route = useRoute()
const auth = useAuthStore()
const profileStore = useProfileStore()
const exercisesStore = useExercisesStore()
const activeWorkout = useActiveWorkoutStore()
const routinesStore = useRoutinesStore()
const workoutsStore = useWorkoutsStore()

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
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="mx-auto max-w-xl p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+1rem)]">
    <RouterView />
  </main>
  <BottomNav v-if="showNav" />
  <Toaster position="top-center" />
</template>
