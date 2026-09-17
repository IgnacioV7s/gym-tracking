<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import {
  EQUIPMENT,
  MUSCLE_GROUPS,
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

const { t } = useI18n()

const name = ref('')
const primaryMuscle = ref<MuscleGroup>('chest')
const secondaryMuscles = ref<MuscleGroup[]>([])
const equipment = ref<ExerciseInput['equipment']>('barbell')
const submitting = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.exercise?.name ?? ''
    primaryMuscle.value = props.exercise?.primaryMuscle ?? 'chest'
    secondaryMuscles.value = [...(props.exercise?.secondaryMuscles ?? [])]
    equipment.value = props.exercise?.equipment ?? 'barbell'
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
    toast.error(t(parsed.error.issues[0]?.message ?? 'exercises.form.invalid'))
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
        <SheetTitle>{{
          exercise ? t('exercises.form.titleEdit') : t('exercises.form.titleNew')
        }}</SheetTitle>
        <SheetDescription>{{ t('exercises.form.subtitle') }}</SheetDescription>
      </SheetHeader>

      <form id="exercise-form" class="grid gap-4 px-4" @submit.prevent="submit">
        <div class="grid gap-2">
          <Label for="exercise-name">{{ t('exercises.form.name') }}</Label>
          <Input id="exercise-name" v-model="name" required maxlength="100" autocomplete="off" />
        </div>

        <div class="grid gap-2">
          <Label for="exercise-primary">{{ t('exercises.form.primaryMuscle') }}</Label>
          <NativeSelect id="exercise-primary" v-model="primaryMuscle">
            <NativeSelectOption v-for="m in MUSCLE_GROUPS" :key="m" :value="m">
              {{ t(`muscle.${m}`) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="grid gap-2">
          <Label for="exercise-equipment">{{ t('exercises.form.equipment') }}</Label>
          <NativeSelect id="exercise-equipment" v-model="equipment">
            <NativeSelectOption v-for="e in EQUIPMENT" :key="e" :value="e">
              {{ t(`equipment.${e}`) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <fieldset class="grid gap-2">
          <legend class="text-sm font-medium">{{ t('exercises.form.secondaryMuscles') }}</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in MUSCLE_GROUPS.filter((g) => g !== primaryMuscle)"
              :key="m"
              type="button"
              class="min-h-0 rounded-full"
              :aria-pressed="secondaryMuscles.includes(m)"
              @click="toggleSecondary(m)"
            >
              <Badge
                :variant="secondaryMuscles.includes(m) ? 'default' : 'outline'"
                class="px-3 py-1.5"
              >
                {{ t(`muscle.${m}`) }}
              </Badge>
            </button>
          </div>
        </fieldset>
      </form>

      <SheetFooter>
        <Button type="submit" form="exercise-form" :disabled="submitting">
          {{ exercise ? t('common.save') : t('common.create') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
