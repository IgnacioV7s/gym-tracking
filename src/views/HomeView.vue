<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Settings, Dumbbell, Play, ChevronRight } from '@lucide/vue'
import { useProfileStore } from '@/stores/profile'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const profileStore = useProfileStore()
const active = useActiveWorkoutStore()
const starting = ref(false)

onMounted(() => active.load())

async function startFree() {
  starting.value = true
  try {
    await active.start(`Entrenamiento ${new Date().toLocaleDateString('es', { weekday: 'long' })}`)
    await router.push({ name: 'workout' })
  } catch (e) {
    toast.error('No se pudo empezar', { description: e instanceof Error ? e.message : undefined })
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold tracking-tight">
      Hola{{ profileStore.profile?.displayName ? `, ${profileStore.profile.displayName}` : '' }}
    </h1>
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'settings' }" aria-label="Ajustes">
        <Settings class="size-5" />
      </RouterLink>
    </Button>
  </header>

  <Card v-if="active.workout" class="mt-6">
    <CardHeader>
      <CardTitle>Sesión en curso</CardTitle>
      <CardDescription>{{ active.workout.name }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button class="w-full" as-child>
        <RouterLink :to="{ name: 'workout' }">
          Continuar sesión
          <ChevronRight class="size-4" />
        </RouterLink>
      </Button>
    </CardContent>
  </Card>

  <div v-else class="mt-6 grid gap-2">
    <Button size="lg" class="w-full" :disabled="starting || !active.loaded" @click="startFree">
      <Play class="size-4" />
      Empezar entrenamiento libre
    </Button>
    <Button variant="secondary" class="w-full" as-child>
      <RouterLink :to="{ name: 'routines' }">Empezar desde una rutina</RouterLink>
    </Button>
  </div>

  <nav class="mt-8 grid gap-2" aria-label="Accesos">
    <Button variant="outline" class="justify-start" as-child>
      <RouterLink :to="{ name: 'exercises' }">
        <Dumbbell class="size-4" />
        Ejercicios
      </RouterLink>
    </Button>
  </nav>
</template>
