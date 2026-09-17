<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Exercise,
  type ExerciseInput,
  type MuscleGroup,
} from '@/domain/models'
import { exerciseInputSchema } from '@/domain/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const props = defineProps<{
  open: boolean
  /** When set, the sheet edits this exercise; otherwise it creates one. */
  exercise?: Exercise | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [input: ExerciseInput, id: string | null]
}>()

const name = ref('')
const primaryMuscle = ref<MuscleGroup>('chest')
const secondaryMuscles = ref<MuscleGroup[]>([])
const equipment = ref<ExerciseInput['equipment']>('barbell')
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.exercise?.name ?? ''
    primaryMuscle.value = props.exercise?.primaryMuscle ?? 'chest'
    secondaryMuscles.value = [...(props.exercise?.secondaryMuscles ?? [])]
    equipment.value = props.exercise?.equipment ?? 'barbell'
    errorMessage.value = null
  },
)

function toggleSecondary(muscle: MuscleGroup) {
  const i = secondaryMuscles.value.indexOf(muscle)
  if (i === -1) secondaryMuscles.value.push(muscle)
  else secondaryMuscles.value.splice(i, 1)
}

function submit() {
  const parsed = exerciseInputSchema.safeParse({
    name: name.value,
    primaryMuscle: primaryMuscle.value,
    secondaryMuscles: secondaryMuscles.value.filter((m) => m !== primaryMuscle.value),
    equipment: equipment.value,
  })
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    toast.error(errorMessage.value)
    return
  }
  submitting.value = true
  emit('submit', parsed.data, props.exercise?.id ?? null)
  submitting.value = false
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="max-h-[90dvh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ exercise ? 'Editar ejercicio' : 'Nuevo ejercicio' }}</SheetTitle>
        <SheetDescription>Solo tú verás este ejercicio.</SheetDescription>
      </SheetHeader>

      <form id="exercise-form" class="grid gap-4 px-4" @submit.prevent="submit">
        <div class="grid gap-2">
          <Label for="exercise-name">Nombre</Label>
          <Input id="exercise-name" v-model="name" required maxlength="100" autocomplete="off" />
        </div>

        <div class="grid gap-2">
          <Label for="exercise-primary">Músculo principal</Label>
          <NativeSelect id="exercise-primary" v-model="primaryMuscle">
            <NativeSelectOption v-for="m in MUSCLE_GROUPS" :key="m" :value="m">
              {{ MUSCLE_GROUP_LABELS[m] }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="grid gap-2">
          <Label for="exercise-equipment">Equipo</Label>
          <NativeSelect id="exercise-equipment" v-model="equipment">
            <NativeSelectOption v-for="e in EQUIPMENT" :key="e" :value="e">
              {{ EQUIPMENT_LABELS[e] }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <fieldset class="grid gap-2">
          <legend class="text-sm font-medium">Músculos secundarios</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in MUSCLE_GROUPS.filter((g) => g !== primaryMuscle)"
              :key="m"
              type="button"
              class="min-h-0 rounded-full"
              :aria-pressed="secondaryMuscles.includes(m)"
              @click="toggleSecondary(m)"
            >
              <Badge :variant="secondaryMuscles.includes(m) ? 'default' : 'outline'" class="px-3 py-1.5">
                {{ MUSCLE_GROUP_LABELS[m] }}
              </Badge>
            </button>
          </div>
        </fieldset>
      </form>

      <SheetFooter>
        <Button type="submit" form="exercise-form" :disabled="submitting">
          {{ exercise ? 'Guardar' : 'Crear' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
