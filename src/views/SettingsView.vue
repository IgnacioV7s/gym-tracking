<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { LOCALES, type ProfileUpdate } from '@/domain/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import OnboardingDialog from '@/components/onboarding/OnboardingDialog.vue'

const { t } = useI18n()
const auth = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()
const signingOut = ref(false)
const tutorialOpen = ref(false)

const WEIGHT_UNITS = ['kg', 'lb'] as const
const THEMES = ['system', 'light', 'dark'] as const
const FORMULAS = ['epley', 'brzycki'] as const

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

async function save(changes: ProfileUpdate) {
  try {
    await profileStore.update(changes)
    toast.success(t('common.saved'))
  } catch (e) {
    toast.error(t('common.couldNotSave'), {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

async function signOut() {
  signingOut.value = true
  try {
    await auth.signOut()
    profileStore.reset()
    await router.replace({ name: 'auth-login' })
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <h1 class="text-2xl font-semibold tracking-tight">{{ t('settings.title') }}</h1>

  <div v-if="!profileStore.profile" class="mt-6 grid gap-4">
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-10 w-full" />
  </div>

  <div v-else class="mt-6 grid gap-6">
    <div class="grid gap-2">
      <Label for="displayName">{{ t('settings.displayName') }}</Label>
      <Input
        id="displayName"
        :model-value="profileStore.profile.displayName ?? ''"
        maxlength="50"
        @change="save({ displayName: ($event.target as HTMLInputElement).value || null })"
      />
    </div>

    <div class="grid gap-2">
      <Label for="language">{{ t('settings.language') }}</Label>
      <NativeSelect
        id="language"
        :model-value="profileStore.profile.locale"
        @update:model-value="save({ locale: oneOf(LOCALES, $event) })"
      >
        <NativeSelectOption v-for="l in LOCALES" :key="l" :value="l">{{
          t(`locale.${l}`)
        }}</NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="grid gap-2">
      <Label for="weightUnit">{{ t('settings.weightUnit') }}</Label>
      <NativeSelect
        id="weightUnit"
        :model-value="profileStore.profile.weightUnit"
        @update:model-value="save({ weightUnit: oneOf(WEIGHT_UNITS, $event) })"
      >
        <NativeSelectOption value="kg">{{ t('settings.kg') }}</NativeSelectOption>
        <NativeSelectOption value="lb">{{ t('settings.lb') }}</NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="grid gap-2">
      <Label for="theme">{{ t('settings.theme') }}</Label>
      <NativeSelect
        id="theme"
        :model-value="profileStore.profile.theme"
        @update:model-value="save({ theme: oneOf(THEMES, $event) })"
      >
        <NativeSelectOption value="system">{{ t('settings.themeSystem') }}</NativeSelectOption>
        <NativeSelectOption value="light">{{ t('settings.themeLight') }}</NativeSelectOption>
        <NativeSelectOption value="dark">{{ t('settings.themeDark') }}</NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="grid gap-2">
      <Label for="rest">{{ t('settings.restSeconds') }}</Label>
      <Input
        id="rest"
        type="number"
        inputmode="numeric"
        min="0"
        max="3600"
        step="5"
        :model-value="profileStore.profile.defaultRestSeconds"
        @change="save({ defaultRestSeconds: Number(($event.target as HTMLInputElement).value) })"
      />
    </div>

    <div class="grid gap-2">
      <Label for="formula">{{ t('settings.formula') }}</Label>
      <NativeSelect
        id="formula"
        :model-value="profileStore.profile.oneRepMaxFormula"
        @update:model-value="save({ oneRepMaxFormula: oneOf(FORMULAS, $event) })"
      >
        <NativeSelectOption value="epley">Epley</NativeSelectOption>
        <NativeSelectOption value="brzycki">Brzycki</NativeSelectOption>
      </NativeSelect>
    </div>

    <Separator />

    <Button variant="outline" @click="tutorialOpen = true">{{ t('onboarding.replay') }}</Button>

    <div class="grid gap-2">
      <p class="text-sm text-muted-foreground">
        {{ t('settings.signedInAs', { email: auth.user?.email }) }}
      </p>
      <Button variant="outline" :disabled="signingOut" @click="signOut">{{
        t('settings.signOut')
      }}</Button>
    </div>
  </div>

  <OnboardingDialog v-model:open="tutorialOpen" />
</template>
