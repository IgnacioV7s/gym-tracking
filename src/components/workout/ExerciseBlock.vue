<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import type { SetType, WeightUnit, WorkoutExercise, WorkoutSet } from '@/domain/models'
import { Button } from '@/components/ui/button'
import SetRow from './SetRow.vue'

defineProps<{
  exercise: WorkoutExercise
  name: string
  unit: WeightUnit
  previousSet: (position: number) => WorkoutSet | undefined
}>()

const emit = defineEmits<{
  addSet: []
  removeExercise: []
  updateSet: [setId: string, changes: { reps?: number; weightKg?: number; type?: SetType }]
  toggleSet: [setId: string]
  removeSet: [setId: string]
}>()
</script>

<template>
  <section class="rounded-xl border bg-card p-3" :aria-label="name">
    <header class="mb-2 flex items-center gap-2">
      <h2 class="flex-1 truncate font-semibold">{{ name }}</h2>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="`Quitar ${name} de la sesión`"
        @click="emit('removeExercise')"
      >
        <Trash2 class="size-4" />
      </Button>
    </header>

    <div
      class="mb-1 grid grid-cols-[2rem_1fr_4.5rem_4rem_2.75rem_2.5rem] gap-2 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
      aria-hidden="true"
    >
      <span>#</span>
      <span>Anterior</span>
      <span class="text-center">{{ unit }}</span>
      <span class="text-center">Reps</span>
      <span />
      <span />
    </div>

    <div class="grid gap-1">
      <SetRow
        v-for="(set, i) in exercise.sets"
        :key="set.id"
        :set="set"
        :index="i"
        :unit="unit"
        :previous="previousSet(i)"
        @update="emit('updateSet', set.id, $event)"
        @toggle="emit('toggleSet', set.id)"
        @remove="emit('removeSet', set.id)"
      />
    </div>

    <Button variant="secondary" class="mt-2 w-full" @click="emit('addSet')">
      <Plus class="size-4" />
      Agregar serie
    </Button>
  </section>
</template>
