<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { Plus, Search, Pencil, Archive, ArchiveRestore, ChevronLeft } from '@lucide/vue'
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Exercise,
  type ExerciseInput,
} from '@/domain/models'
import { useExercisesStore } from '@/stores/exercises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import ExerciseFormSheet from '@/components/exercise/ExerciseFormSheet.vue'

const store = useExercisesStore()

const query = ref('')
const muscle = ref<string>('')
const equipment = ref<string>('')
const showArchived = ref(false)
const sheetOpen = ref(false)
const editing = ref<Exercise | null>(null)

onMounted(() => store.load())

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const filtered = computed(() => {
  const q = normalize(query.value.trim())
  return store.items.filter((e) => {
    if (!showArchived.value && e.archivedAt) return false
    if (muscle.value && e.primaryMuscle !== muscle.value) return false
    if (equipment.value && e.equipment !== equipment.value) return false
    return !q || normalize(e.name).includes(q)
  })
})

function openCreate() {
  editing.value = null
  sheetOpen.value = true
}

function openEdit(exercise: Exercise) {
  editing.value = exercise
  sheetOpen.value = true
}

async function onSubmit(input: ExerciseInput, id: string | null) {
  try {
    if (id) await store.update(id, input)
    else await store.create(input)
    sheetOpen.value = false
    toast.success(id ? 'Ejercicio actualizado' : 'Ejercicio creado')
  } catch (e) {
    toast.error('No se pudo guardar', { description: e instanceof Error ? e.message : undefined })
  }
}

async function toggleArchive(exercise: Exercise) {
  try {
    if (exercise.archivedAt) await store.unarchive(exercise.id)
    else await store.archive(exercise.id)
  } catch (e) {
    toast.error('No se pudo actualizar', { description: e instanceof Error ? e.message : undefined })
  }
}
</script>

<template>
  <header class="flex items-center gap-2">
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'home' }" aria-label="Volver">
        <ChevronLeft class="size-5" />
      </RouterLink>
    </Button>
    <h1 class="flex-1 text-2xl font-semibold tracking-tight">Ejercicios</h1>
    <Button size="sm" @click="openCreate">
      <Plus class="size-4" />
      Nuevo
    </Button>
  </header>

  <div class="mt-4 grid gap-3">
    <div class="relative">
      <Search
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="query"
        type="search"
        placeholder="Buscar ejercicio"
        aria-label="Buscar ejercicio"
        class="pl-9"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <NativeSelect v-model="muscle" aria-label="Filtrar por músculo">
        <NativeSelectOption value="">Todos los músculos</NativeSelectOption>
        <NativeSelectOption v-for="m in MUSCLE_GROUPS" :key="m" :value="m">
          {{ MUSCLE_GROUP_LABELS[m] }}
        </NativeSelectOption>
      </NativeSelect>
      <NativeSelect v-model="equipment" aria-label="Filtrar por equipo">
        <NativeSelectOption value="">Todo el equipo</NativeSelectOption>
        <NativeSelectOption v-for="e in EQUIPMENT" :key="e" :value="e">
          {{ EQUIPMENT_LABELS[e] }}
        </NativeSelectOption>
      </NativeSelect>
    </div>
    <div class="flex items-center gap-2">
      <Switch id="show-archived" v-model="showArchived" />
      <Label for="show-archived" class="font-normal text-muted-foreground">Mostrar archivados</Label>
    </div>
  </div>

  <div v-if="store.loading && !store.loaded" class="mt-4 grid gap-2">
    <Skeleton v-for="i in 6" :key="i" class="h-16 w-full" />
  </div>

  <p v-else-if="store.error" class="mt-6 text-center text-sm text-destructive">
    {{ store.error }}
  </p>

  <p v-else-if="filtered.length === 0" class="mt-10 text-center text-sm text-muted-foreground">
    No hay ejercicios que coincidan.
  </p>

  <ul v-else class="mt-4 divide-y rounded-lg border">
    <li
      v-for="exercise in filtered"
      :key="exercise.id"
      class="flex items-center gap-3 px-3 py-2"
      :class="{ 'opacity-60': exercise.archivedAt }"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium">{{ exercise.name }}</p>
        <p class="text-xs text-muted-foreground">
          {{ MUSCLE_GROUP_LABELS[exercise.primaryMuscle] }} · {{ EQUIPMENT_LABELS[exercise.equipment] }}
        </p>
      </div>
      <Badge v-if="exercise.userId" variant="secondary">Propio</Badge>
      <template v-if="exercise.userId">
        <Button variant="ghost" size="icon" :aria-label="`Editar ${exercise.name}`" @click="openEdit(exercise)">
          <Pencil class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`${exercise.archivedAt ? 'Restaurar' : 'Archivar'} ${exercise.name}`"
          @click="toggleArchive(exercise)"
        >
          <ArchiveRestore v-if="exercise.archivedAt" class="size-4" />
          <Archive v-else class="size-4" />
        </Button>
      </template>
    </li>
  </ul>

  <ExerciseFormSheet v-model:open="sheetOpen" :exercise="editing" @submit="onSubmit" />
</template>
