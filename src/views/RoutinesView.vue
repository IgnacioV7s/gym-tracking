<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Plus, Play, Pencil, Copy, Trash2 } from '@lucide/vue'
import type { Routine } from '@/domain/models'
import { useRoutinesStore } from '@/stores/routines'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseName } from '@/composables/useExerciseName'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const { t } = useI18n()
const { nameById } = useExerciseName()
const router = useRouter()
const routines = useRoutinesStore()
const exercises = useExercisesStore()
const active = useActiveWorkoutStore()

const toDelete = ref<Routine | null>(null)
const busy = ref(false)

onMounted(() => Promise.all([routines.load(), exercises.load(), active.load()]))

function describe(routine: Routine) {
  return routine.exercises
    .map((e) => nameById(e.exerciseId))
    .slice(0, 4)
    .join(' · ')
}

async function start(routine: Routine) {
  if (active.isActive) {
    toast.error(t('workout.alreadyActive'), { description: t('workout.alreadyActiveHint') })
    return
  }
  busy.value = true
  try {
    await active.startFromRoutine(routine)
    await router.push({ name: 'workout' })
  } catch (e) {
    toast.error(t('home.couldNotStart'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}

async function duplicate(routine: Routine) {
  try {
    await routines.duplicate(routine.id)
    toast.success(t('routines.duplicated'))
  } catch (e) {
    toast.error(t('routines.couldNotDuplicate'), {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  busy.value = true
  try {
    await routines.remove(toDelete.value.id)
    toast.success(t('routines.deleted'))
    toDelete.value = null
  } catch (e) {
    toast.error(t('common.couldNotDelete'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <header class="flex items-center gap-2">
    <h1 class="flex-1 text-2xl font-semibold tracking-tight">{{ t('routines.title') }}</h1>
    <Button size="sm" as-child>
      <RouterLink :to="{ name: 'routine-new' }">
        <Plus class="size-4" />
        {{ t('routines.new') }}
      </RouterLink>
    </Button>
  </header>

  <div v-if="routines.loading && !routines.loaded" class="mt-4 grid gap-3">
    <Skeleton v-for="i in 3" :key="i" class="h-28 w-full" />
  </div>

  <p v-else-if="routines.error" class="mt-6 text-center text-sm text-destructive">
    {{ routines.error }}
  </p>

  <div v-else-if="routines.items.length === 0" class="mt-12 text-center">
    <p class="text-muted-foreground">{{ t('routines.empty') }}</p>
    <Button class="mt-4" as-child>
      <RouterLink :to="{ name: 'routine-new' }">{{ t('routines.createFirst') }}</RouterLink>
    </Button>
  </div>

  <div v-else v-reveal class="mt-4 grid gap-3">
    <Card v-for="routine in routines.items" :key="routine.id">
      <CardHeader>
        <CardTitle>{{ routine.name }}</CardTitle>
        <CardDescription>
          {{ t('routines.exerciseCount', { n: routine.exercises.length }) }} ·
          {{ describe(routine) }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex items-center gap-1">
        <Button class="flex-1" :disabled="busy" @click="start(routine)">
          <Play class="size-4" />
          {{ t('routines.start') }}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.edit', { name: routine.name })"
          as-child
        >
          <RouterLink :to="{ name: 'routine-edit', params: { id: routine.id } }">
            <Pencil class="size-4" />
          </RouterLink>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('routines.duplicate', { name: routine.name })"
          @click="duplicate(routine)"
        >
          <Copy class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.delete') + ' ' + routine.name"
          @click="toDelete = routine"
        >
          <Trash2 class="size-4" />
        </Button>
      </CardContent>
    </Card>
  </div>

  <Dialog :open="toDelete !== null" @update:open="(v) => !v && (toDelete = null)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('routines.deleteDialog.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('routines.deleteDialog.description', { name: toDelete?.name ?? '' }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="toDelete = null">{{ t('common.cancel') }}</Button>
        <Button variant="destructive" :disabled="busy" @click="confirmDelete">{{
          t('common.delete')
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
