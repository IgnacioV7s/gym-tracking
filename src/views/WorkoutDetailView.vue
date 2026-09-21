<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { ChevronLeft, Trash2, Check } from '@lucide/vue'
import type { Workout } from '@/domain/models'
import { workoutDurationMinutes, workoutVolumeKg, workoutWorkingSets } from '@/domain/analytics'
import { displayWeight, formatWeight, inputToKg } from '@/domain/units/weight'
import type { WorkoutSet } from '@/domain/models'
import { dateFnsLocale } from '@/i18n'
import { useWorkoutsStore } from '@/stores/workouts'
import { useExercisesStore } from '@/stores/exercises'
import { useProfileStore } from '@/stores/profile'
import { useExerciseName } from '@/composables/useExerciseName'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
const route = useRoute()
const router = useRouter()
const store = useWorkoutsStore()
const exercises = useExercisesStore()
const profileStore = useProfileStore()

const workout = ref<Workout | null>(null)
const loaded = ref(false)
const confirmDelete = ref(false)
const busy = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')
const id = computed(() => String(route.params.id))

onMounted(async () => {
  await exercises.load()
  workout.value = await store.get(id.value)
  loaded.value = true
  if (!workout.value) {
    toast.error(t('history.detail.notFound'))
    await router.replace({ name: 'history' })
  }
})

async function saveMeta(changes: { name?: string; notes?: string | null }) {
  if (!workout.value) return
  try {
    await store.updateMeta(workout.value.id, changes)
    Object.assign(workout.value, changes)
    toast.success(t('common.saved'))
  } catch (e) {
    toast.error(t('common.couldNotSave'), {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

async function editSet(set: WorkoutSet, changes: Partial<WorkoutSet>) {
  if (!workout.value) return
  try {
    await store.updateSet(workout.value.id, set.id, changes)
    Object.assign(set, changes)
  } catch (e) {
    toast.error(t('common.couldNotSave'), {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

function onWeight(set: WorkoutSet, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (raw === '' || !Number.isFinite(n) || n < 0) return
  void editSet(set, { weightKg: inputToKg(n, unit.value) })
}

function onReps(set: WorkoutSet, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (raw === '' || !Number.isInteger(n) || n < 0) return
  void editSet(set, { reps: n })
}

async function removeSet(exerciseIndex: number, set: WorkoutSet) {
  if (!workout.value) return
  try {
    await store.removeSet(workout.value.id, set.id)
    const ex = workout.value.exercises[exerciseIndex]
    if (ex) ex.sets = ex.sets.filter((s) => s.id !== set.id)
  } catch (e) {
    toast.error(t('common.couldNotDelete'), {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

async function remove() {
  if (!workout.value) return
  busy.value = true
  try {
    await store.remove(workout.value.id)
    toast.success(t('history.detail.deleted'))
    await router.replace({ name: 'history' })
  } catch (e) {
    toast.error(t('common.couldNotDelete'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}

const TYPE_LABEL = { normal: '', warmup: 'W', drop: 'D', failure: 'F' } as const
</script>

<template>
  <header class="flex items-center gap-2">
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'history' }" :aria-label="t('common.back')">
        <ChevronLeft class="size-5" />
      </RouterLink>
    </Button>
    <h1 class="flex-1 truncate text-2xl font-semibold tracking-tight">
      {{ workout?.name ?? t('history.detail.title') }}
    </h1>
    <Button
      v-if="workout"
      variant="ghost"
      size="icon"
      :aria-label="t('common.delete')"
      @click="confirmDelete = true"
    >
      <Trash2 class="size-4" />
    </Button>
  </header>

  <div v-if="!loaded" class="mt-4 grid gap-3">
    <Skeleton class="h-16 w-full" />
    <Skeleton class="h-40 w-full" />
  </div>

  <template v-else-if="workout">
    <p class="mt-1 text-sm text-muted-foreground">
      {{ format(new Date(workout.startedAt), 'PPPp', { locale: dateFnsLocale() }) }}
    </p>

    <dl class="mt-4 grid grid-cols-3 gap-3 rounded-xl border bg-card p-3 text-center">
      <div>
        <dt class="text-xs text-muted-foreground">{{ t('workout.summary.volume') }}</dt>
        <dd class="font-semibold">{{ formatWeight(workoutVolumeKg(workout), unit) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">{{ t('workout.summary.sets') }}</dt>
        <dd class="font-semibold">{{ workoutWorkingSets(workout) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">{{ t('workout.summary.duration') }}</dt>
        <dd class="font-semibold">
          {{ t('common.minutes', { n: workoutDurationMinutes(workout) }) }}
        </dd>
      </div>
    </dl>

    <div class="mt-4 grid gap-4">
      <div class="grid gap-2">
        <Label for="workout-name">{{ t('history.detail.name') }}</Label>
        <Input
          id="workout-name"
          :model-value="workout.name"
          maxlength="100"
          @change="saveMeta({ name: ($event.target as HTMLInputElement).value || workout.name })"
        />
      </div>
      <div class="grid gap-2">
        <Label for="workout-notes">{{ t('history.detail.notes') }}</Label>
        <Textarea
          id="workout-notes"
          :model-value="workout.notes ?? ''"
          rows="2"
          maxlength="2000"
          @change="saveMeta({ notes: ($event.target as HTMLTextAreaElement).value || null })"
        />
      </div>
    </div>

    <p class="mt-4 text-xs text-muted-foreground">{{ t('history.detail.editHint') }}</p>

    <section
      v-for="(exercise, ei) in workout.exercises"
      :key="exercise.id"
      class="mt-4 rounded-xl border bg-card p-3"
      :aria-label="nameById(exercise.exerciseId)"
    >
      <h2 class="mb-2 font-semibold">
        <RouterLink
          :to="{ name: 'exercise-detail', params: { id: exercise.exerciseId } }"
          class="hover:underline"
        >
          {{ nameById(exercise.exerciseId) }}
        </RouterLink>
      </h2>
      <table class="w-full text-sm">
        <thead class="text-[11px] tracking-wide text-muted-foreground uppercase">
          <tr>
            <th class="w-8 py-1 text-left font-medium">#</th>
            <th class="py-1 text-right font-medium">{{ unit }}</th>
            <th class="py-1 text-right font-medium">{{ t('workout.columns.reps') }}</th>
            <th class="w-10" />
            <th class="w-10" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(set, i) in exercise.sets"
            :key="set.id"
            :class="!set.completed && 'text-muted-foreground line-through'"
          >
            <td class="py-1">{{ TYPE_LABEL[set.type] || i + 1 }}</td>
            <td class="py-1 text-right">
              <input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.5"
                :value="displayWeight(set.weightKg, unit)"
                :aria-label="t('workout.set.weight', { n: i + 1, unit })"
                class="h-9 w-20 rounded-md border bg-background px-1 text-right tabular-nums"
                @change="onWeight(set, $event)"
              />
            </td>
            <td class="py-1 text-right">
              <input
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                :value="set.reps"
                :aria-label="t('workout.set.reps', { n: i + 1 })"
                class="h-9 w-16 rounded-md border bg-background px-1 text-right tabular-nums"
                @change="onReps(set, $event)"
              />
            </td>
            <td class="py-1 text-center">
              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-md border"
                :class="
                  set.completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                "
                :aria-pressed="set.completed"
                :aria-label="
                  t('history.detail.toggleSet', {
                    n: i + 1,
                    state: set.completed ? t('history.detail.undone') : t('history.detail.done'),
                  })
                "
                @click="editSet(set, { completed: !set.completed })"
              >
                <Check class="size-4" />
              </button>
            </td>
            <td class="py-1 text-center">
              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                :aria-label="t('history.detail.removeSet', { n: i + 1 })"
                @click="removeSet(ei, set)"
              >
                <Trash2 class="size-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="exercise.notes" class="mt-2 text-xs text-muted-foreground">{{ exercise.notes }}</p>
    </section>

    <Dialog v-model:open="confirmDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('history.detail.deleteTitle') }}</DialogTitle>
          <DialogDescription>{{ t('history.detail.deleteDescription') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDelete = false">{{ t('common.cancel') }}</Button>
          <Button variant="destructive" :disabled="busy" @click="remove">{{
            t('common.delete')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>
</template>
