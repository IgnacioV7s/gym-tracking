<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { ProfileUpdate } from '@/domain/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const auth = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()
const signingOut = ref(false)

async function save(changes: ProfileUpdate) {
  try {
    await profileStore.update(changes)
    toast.success('Guardado')
  } catch (e) {
    toast.error('No se pudo guardar', { description: e instanceof Error ? e.message : undefined })
  }
}

const WEIGHT_UNITS = ['kg', 'lb'] as const
const THEMES = ['system', 'light', 'dark'] as const
const FORMULAS = ['epley', 'brzycki'] as const

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
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
  <h1 class="text-2xl font-semibold tracking-tight">Ajustes</h1>

  <div v-if="!profileStore.profile" class="mt-6 grid gap-4">
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-10 w-full" />
  </div>

  <div v-else class="mt-6 grid gap-6">
    <div class="grid gap-2">
      <Label for="displayName">Nombre</Label>
      <Input
        id="displayName"
        :model-value="profileStore.profile.displayName ?? ''"
        maxlength="50"
        @change="save({ displayName: ($event.target as HTMLInputElement).value || null })"
      />
    </div>

    <div class="grid gap-2">
      <Label for="weightUnit">Unidad de peso</Label>
      <NativeSelect
        id="weightUnit"
        :model-value="profileStore.profile.weightUnit"
        @update:model-value="save({ weightUnit: oneOf(WEIGHT_UNITS, $event) })"
      >
        <NativeSelectOption value="kg">Kilogramos (kg)</NativeSelectOption>
        <NativeSelectOption value="lb">Libras (lb)</NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="grid gap-2">
      <Label for="theme">Tema</Label>
      <NativeSelect
        id="theme"
        :model-value="profileStore.profile.theme"
        @update:model-value="save({ theme: oneOf(THEMES, $event) })"
      >
        <NativeSelectOption value="system">Sistema</NativeSelectOption>
        <NativeSelectOption value="light">Claro</NativeSelectOption>
        <NativeSelectOption value="dark">Oscuro</NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="grid gap-2">
      <Label for="rest">Descanso por defecto (segundos)</Label>
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
      <Label for="formula">Fórmula de 1RM</Label>
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

    <div class="grid gap-2">
      <p class="text-sm text-muted-foreground">Sesión iniciada como {{ auth.user?.email }}</p>
      <Button variant="outline" :disabled="signingOut" @click="signOut">Cerrar sesión</Button>
    </div>
  </div>
</template>
