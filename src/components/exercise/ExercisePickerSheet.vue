<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@lucide/vue'
import type { Exercise } from '@/domain/models'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseName } from '@/composables/useExerciseName'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; select: [exercise: Exercise] }>()

const { t } = useI18n()
const { nameOf } = useExerciseName()
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
  return store.active
    .map((e) => ({ exercise: e, label: nameOf(e) }))
    .filter(({ label }) => !q || normalize(label).includes(q))
    .sort((a, b) => a.label.localeCompare(b.label))
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
        <SheetTitle>{{ t('exercises.picker.title') }}</SheetTitle>
        <SheetDescription>{{ t('exercises.picker.subtitle') }}</SheetDescription>
      </SheetHeader>
      <div class="relative px-4">
        <Search
          class="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          v-model="query"
          type="search"
          :placeholder="t('common.search')"
          :aria-label="t('exercises.picker.search')"
          class="pl-9"
          autofocus
        />
      </div>
      <ul class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <li v-for="{ exercise, label } in results" :key="exercise.id">
          <button
            type="button"
            class="flex min-h-12 w-full items-center justify-between gap-2 rounded-md px-2 text-left hover:bg-accent"
            :aria-label="label"
            @click="pick(exercise)"
          >
            <span class="truncate">{{ label }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ t(`muscle.${exercise.primaryMuscle}`) }} ·
              {{ t(`equipment.${exercise.equipment}`) }}
            </span>
          </button>
        </li>
        <li v-if="results.length === 0" class="py-6 text-center text-sm text-muted-foreground">
          {{ t('common.noResults') }}
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>
