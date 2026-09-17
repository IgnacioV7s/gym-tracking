<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { Settings, Dumbbell, Play, ChevronRight } from '@lucide/vue'
import { dateFnsLocale } from '@/i18n'
import { useProfileStore } from '@/stores/profile'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import OnboardingDialog from '@/components/onboarding/OnboardingDialog.vue'

const { t } = useI18n()
const router = useRouter()
const profileStore = useProfileStore()
const active = useActiveWorkoutStore()
const starting = ref(false)

const onboardingDismissed = ref(false)
const showOnboarding = computed(
  () =>
    !!profileStore.profile &&
    profileStore.profile.onboardedAt === null &&
    !onboardingDismissed.value,
)

async function finishOnboarding() {
  onboardingDismissed.value = true
  try {
    await profileStore.update({ onboardedAt: new Date().toISOString() })
  } catch {
    // Not fatal: the tutorial will simply show again next time.
  }
}

onMounted(() => active.load())

async function startFree() {
  starting.value = true
  try {
    const weekday = format(new Date(), 'EEEE', { locale: dateFnsLocale() })
    await active.start(t('home.freeWorkoutName', { weekday }))
    await router.push({ name: 'workout' })
  } catch (e) {
    toast.error(t('home.couldNotStart'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold tracking-tight">
      {{
        profileStore.profile?.displayName
          ? t('home.greetingName', { name: profileStore.profile.displayName })
          : t('home.greeting')
      }}
    </h1>
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'settings' }" :aria-label="t('nav.settings')">
        <Settings class="size-5" />
      </RouterLink>
    </Button>
  </header>

  <Card v-if="active.workout" class="mt-6">
    <CardHeader>
      <CardTitle>{{ t('home.activeSession') }}</CardTitle>
      <CardDescription>{{ active.workout.name }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button class="w-full" as-child>
        <RouterLink :to="{ name: 'workout' }">
          {{ t('home.continueSession') }}
          <ChevronRight class="size-4" />
        </RouterLink>
      </Button>
    </CardContent>
  </Card>

  <div v-else class="mt-6 grid gap-2">
    <Button size="lg" class="w-full" :disabled="starting || !active.loaded" @click="startFree">
      <Play class="size-4" />
      {{ t('home.startFree') }}
    </Button>
    <Button variant="secondary" class="w-full" as-child>
      <RouterLink :to="{ name: 'routines' }">{{ t('home.startFromRoutine') }}</RouterLink>
    </Button>
  </div>

  <nav class="mt-8 grid gap-2" :aria-label="t('nav.shortcuts')">
    <Button variant="outline" class="justify-start" as-child>
      <RouterLink :to="{ name: 'exercises' }">
        <Dumbbell class="size-4" />
        {{ t('nav.exercises') }}
      </RouterLink>
    </Button>
  </nav>

  <OnboardingDialog :open="showOnboarding" @finish="finishOnboarding" />
</template>
