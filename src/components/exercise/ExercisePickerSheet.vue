<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type Exercise } from '@/domain/models'
import { useExercisesStore } from '@/stores/exercises'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; select: [exercise: Exercise] }>()

const store = useExercisesStore()
const query = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) {
      query.value = ''
      void store.load()
    }
  },
)

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const results = computed(() => {
  const q = normalize(query.value.trim())
  return store.active.filter((e) => !q || normalize(e.name).includes(q))
})

function pick(exercise: Exercise) {
  emit('select', exercise)
  emit('update:open', false)
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="flex max-h-[85dvh] flex-col">
      <SheetHeader>
        <SheetTitle>Elegir ejercicio</SheetTitle>
        <SheetDescription>Toca uno para agregarlo.</SheetDescription>
      </SheetHeader>
      <div class="relative px-4">
        <Search
          class="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          v-model="query"
          type="search"
          placeholder="Buscar"
          aria-label="Buscar ejercicio para agregar"
          class="pl-9"
          autofocus
        />
      </div>
      <ul class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <li v-for="exercise in results" :key="exercise.id">
          <button
            type="button"
            class="flex min-h-12 w-full items-center justify-between gap-2 rounded-md px-2 text-left hover:bg-accent"
            :aria-label="exercise.name"
            @click="pick(exercise)"
          >
            <span class="truncate">{{ exercise.name }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ MUSCLE_GROUP_LABELS[exercise.primaryMuscle] }} · {{ EQUIPMENT_LABELS[exercise.equipment] }}
            </span>
          </button>
        </li>
        <li v-if="results.length === 0" class="py-6 text-center text-sm text-muted-foreground">
          Sin resultados.
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>
