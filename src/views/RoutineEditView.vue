<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChevronLeft, ChevronUp, ChevronDown, Plus, Trash2 } from '@lucide/vue'
import type { Exercise, RoutineExerciseInput } from '@/domain/models'
import { routineInputSchema } from '@/domain/schemas'
import { displayWeight, inputToKg } from '@/domain/units/weight'
import { useRoutinesStore } from '@/stores/routines'
import { useExercisesStore } from '@/stores/exercises'
import { useProfileStore } from '@/stores/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import ExercisePickerSheet from '@/components/exercise/ExercisePickerSheet.vue'

const route = useRoute()
const router = useRouter()
const routines = useRoutinesStore()
const exercises = useExercisesStore()
const profileStore = useProfileStore()

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')

const name = ref('')
const notes = ref('')
const items = ref<RoutineExerciseInput[]>([])
const ready = ref(false)
const saving = ref(false)
const pickerOpen = ref(false)

onMounted(async () => {
  await exercises.load()
  if (id.value) {
    const routine = await routines.get(id.value)
    if (!routine) {
      toast.error('Rutina no encontrada')
      await router.replace({ name: 'routines' })
      return
    }
    name.value = routine.name
    notes.value = routine.notes ?? ''
    items.value = routine.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeightKg: e.targetWeightKg,
      restSeconds: e.restSeconds,
    }))
  }
  ready.value = true
})

function exerciseName(exerciseId: string) {
  return exercises.byId.get(exerciseId)?.name ?? 'Ejercicio'
}

function addExercise(exercise: Exercise) {
  items.value.push({
    exerciseId: exercise.id,
    targetSets: 3,
    targetReps: 10,
    targetWeightKg: null,
    restSeconds: null,
  })
}

function move(index: number, delta: -1 | 1) {
  const target = index + delta
  if (target < 0 || target >= items.value.length) return
  const arr = items.value
  ;[arr[index], arr[target]] = [arr[target]!, arr[index]!]
}

function numberOrNull(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  return raw === '' || !Number.isFinite(n) ? null : n
}

function setWeight(item: RoutineExerciseInput, e: Event) {
  const n = numberOrNull(e)
  item.targetWeightKg = n === null ? null : inputToKg(n, unit.value)
}

async function save() {
  const parsed = routineInputSchema.safeParse({
    name: name.value,
    notes: notes.value || null,
    exercises: items.value,
  })
  if (!parsed.success) {
    toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos')
    return
  }
  saving.value = true
  try {
    if (id.value) await routines.update(id.value, parsed.data)
    else await routines.create(parsed.data)
    toast.success('Rutina guardada')
    await router.replace({ name: 'routines' })
  } catch (e) {
    toast.error('No se pudo guardar', { description: e instanceof Error ? e.message : undefined })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <header class="flex items-center gap-2">
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'routines' }" aria-label="Volver">
        <ChevronLeft class="size-5" />
      </RouterLink>
    </Button>
    <h1 class="flex-1 text-2xl font-semibold tracking-tight">
      {{ id ? 'Editar rutina' : 'Nueva rutina' }}
    </h1>
  </header>

  <div v-if="!ready" class="mt-4 grid gap-3">
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-32 w-full" />
  </div>

  <form v-else class="mt-4 grid gap-5" @submit.prevent="save">
    <div class="grid gap-2">
      <Label for="routine-name">Nombre</Label>
      <Input id="routine-name" v-model="name" required maxlength="100" autocomplete="off" />
    </div>
    <div class="grid gap-2">
      <Label for="routine-notes">Notas</Label>
      <Textarea id="routine-notes" v-model="notes" rows="2" maxlength="2000" />
    </div>

    <section aria-label="Ejercicios de la rutina" class="grid gap-3">
      <h2 class="text-sm font-medium">Ejercicios</h2>

      <p v-if="items.length === 0" class="text-sm text-muted-foreground">
        Agrega al menos un ejercicio.
      </p>

      <div
        v-for="(item, i) in items"
        :key="`${item.exerciseId}-${i}`"
        class="rounded-xl border bg-card p-3"
        :data-testid="`routine-item-${i}`"
      >
        <div class="flex items-center gap-1">
          <p class="flex-1 truncate font-medium">{{ exerciseName(item.exerciseId) }}</p>
          <Button type="button" variant="ghost" size="icon" :disabled="i === 0" aria-label="Subir" @click="move(i, -1)">
            <ChevronUp class="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="i === items.length - 1"
            aria-label="Bajar"
            @click="move(i, 1)"
          >
            <ChevronDown class="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :aria-label="`Quitar ${exerciseName(item.exerciseId)}`"
            @click="items.splice(i, 1)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
        <div class="mt-2 grid grid-cols-4 gap-2">
          <div class="grid gap-1">
            <Label :for="`sets-${i}`" class="text-xs">Series</Label>
            <Input :id="`sets-${i}`" v-model.number="item.targetSets" type="number" inputmode="numeric" min="1" max="50" />
          </div>
          <div class="grid gap-1">
            <Label :for="`reps-${i}`" class="text-xs">Reps</Label>
            <Input :id="`reps-${i}`" v-model.number="item.targetReps" type="number" inputmode="numeric" min="1" max="500" />
          </div>
          <div class="grid gap-1">
            <Label :for="`weight-${i}`" class="text-xs">{{ unit }}</Label>
            <Input
              :id="`weight-${i}`"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.5"
              :model-value="item.targetWeightKg === null || item.targetWeightKg === undefined ? '' : displayWeight(item.targetWeightKg, unit)"
              @change="setWeight(item, $event)"
            />
          </div>
          <div class="grid gap-1">
            <Label :for="`rest-${i}`" class="text-xs">Desc. (s)</Label>
            <Input
              :id="`rest-${i}`"
              type="number"
              inputmode="numeric"
              min="0"
              max="3600"
              step="5"
              :model-value="item.restSeconds ?? ''"
              @change="item.restSeconds = numberOrNull($event)"
            />
          </div>
        </div>
      </div>

      <Button type="button" variant="outline" @click="pickerOpen = true">
        <Plus class="size-4" />
        Agregar ejercicio
      </Button>
    </section>

    <Button type="submit" size="lg" :disabled="saving">Guardar rutina</Button>
  </form>

  <ExercisePickerSheet v-model:open="pickerOpen" @select="addExercise" />
</template>
