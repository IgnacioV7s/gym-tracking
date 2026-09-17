<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Plus, Check, CloudOff, Cloud, Loader2 } from '@lucide/vue'
import type { Exercise, SetType, Workout } from '@/domain/models'
import { formatWeight } from '@/domain/units/weight'
import {
  workoutDurationMinutes,
  workoutVolumeKg,
  workoutWorkingSets,
} from '@/domain/analytics/volume'
import { useActiveWorkoutStore } from '@/stores/activeWorkout'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseName } from '@/composables/useExerciseName'
import { useProfileStore } from '@/stores/profile'
import { useWorkoutsStore } from '@/stores/workouts'
import { useTimer } from '@/composables/useTimer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ExerciseBlock from '@/components/workout/ExerciseBlock.vue'
import RestTimer from '@/components/workout/RestTimer.vue'
import ExercisePickerSheet from '@/components/exercise/ExercisePickerSheet.vue'

const { t } = useI18n()
const { nameById } = useExerciseName()
const router = useRouter()
const active = useActiveWorkoutStore()
const exercises = useExercisesStore()
const profileStore = useProfileStore()
const workoutsStore = useWorkoutsStore()
const timer = useTimer()

const pickerOpen = ref(false)
const confirmFinishOpen = ref(false)
const confirmDiscardOpen = ref(false)
const finished = ref<Workout | null>(null)
const busy = ref(false)

const unit = computed(() => profileStore.profile?.weightUnit ?? 'kg')
const restSeconds = computed(() => profileStore.profile?.defaultRestSeconds ?? 90)

onMounted(async () => {
  await Promise.all([active.load(), exercises.load()])
})

// No active session and nothing being shown as summary → nothing to do here.
watch(
  () => [active.loaded, active.isActive, finished.value, busy.value] as const,
  ([loaded, isActive, done, working]) => {
    if (loaded && !isActive && !done && !working) void router.replace({ name: 'home' })
  },
  { immediate: true },
)

function onPick(exercise: Exercise) {
  void active.addExercise(exercise.id).catch((e) =>
    toast.error(t('workout.couldNotAdd'), {
      description: e instanceof Error ? e.message : undefined,
    }),
  )
}

function onUpdateSet(setId: string, changes: { reps?: number; weightKg?: number; type?: SetType }) {
  active.updateSet(setId, changes)
}

async function onToggleSet(setId: string) {
  const completed = await active.toggleCompleted(setId)
  if (completed && restSeconds.value > 0) timer.start(restSeconds.value)
}

async function finish() {
  busy.value = true
  try {
    finished.value = await active.finish()
    workoutsStore.invalidate()
    confirmFinishOpen.value = false
    timer.stop()
  } catch (e) {
    toast.error(t('workout.couldNotFinish'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}

async function discard() {
  busy.value = true
  try {
    await active.discard()
    confirmDiscardOpen.value = false
    timer.stop()
    toast(t('workout.discarded'))
  } catch (e) {
    toast.error(t('workout.couldNotDiscard'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}

function closeSummary() {
  finished.value = null
  void router.replace({ name: 'home' })
}
</script>

<template>
  <template v-if="active.workout">
    <header class="flex items-center gap-2">
      <h1 class="flex-1 truncate text-2xl font-semibold tracking-tight">
        {{ active.workout.name }}
      </h1>
      <span
        class="flex items-center gap-1 text-xs text-muted-foreground"
        role="status"
        :aria-label="t('workout.saveStatus', { status: active.saveStatus })"
      >
        <Loader2 v-if="active.saveStatus === 'saving'" class="size-4 animate-spin" />
        <CloudOff v-else-if="active.saveStatus === 'error'" class="size-4 text-destructive" />
        <Cloud v-else class="size-4" />
        <span v-if="active.saveStatus === 'error'" class="text-destructive">{{
          t('workout.unsaved')
        }}</span>
      </span>
    </header>

    <div class="mt-4 grid gap-3">
      <ExerciseBlock
        v-for="exercise in active.workout.exercises"
        :key="exercise.id"
        :exercise="exercise"
        :name="nameById(exercise.exerciseId)"
        :unit="unit"
        :previous-set="(i) => active.previousSet(exercise.exerciseId, i)"
        @add-set="active.addSet(exercise.id)"
        @remove-exercise="active.removeExercise(exercise.id)"
        @update-set="onUpdateSet"
        @toggle-set="onToggleSet"
        @remove-set="active.removeSet($event)"
      />

      <Button variant="outline" class="w-full" @click="pickerOpen = true">
        <Plus class="size-4" />
        {{ t('workout.addExercise') }}
      </Button>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <Button variant="ghost" class="text-destructive" @click="confirmDiscardOpen = true">
          {{ t('workout.discard') }}
        </Button>
        <Button @click="confirmFinishOpen = true">
          <Check class="size-4" />
          {{ t('workout.finish') }}
        </Button>
      </div>
    </div>

    <RestTimer
      :remaining="timer.remaining.value"
      :running="timer.running.value"
      @add="timer.add($event)"
      @stop="timer.stop()"
    />
    <ExercisePickerSheet v-model:open="pickerOpen" @select="onPick" />

    <Dialog v-model:open="confirmFinishOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('workout.finishDialog.title') }}</DialogTitle>
          <DialogDescription>{{ t('workout.finishDialog.description') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmFinishOpen = false">{{
            t('workout.finishDialog.keepGoing')
          }}</Button>
          <Button :disabled="busy" @click="finish">{{ t('workout.finish') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="confirmDiscardOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('workout.discardDialog.title') }}</DialogTitle>
          <DialogDescription>{{ t('workout.discardDialog.description') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDiscardOpen = false">{{
            t('common.cancel')
          }}</Button>
          <Button variant="destructive" :disabled="busy" @click="discard">{{
            t('workout.discard')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>

  <div v-else-if="!finished" class="grid gap-3">
    <Skeleton class="h-8 w-1/2" />
    <Skeleton class="h-40 w-full" />
  </div>

  <Dialog :open="finished !== null" @update:open="(v) => !v && closeSummary()">
    <DialogContent v-if="finished">
      <DialogHeader>
        <DialogTitle>{{ t('workout.summary.title') }}</DialogTitle>
        <DialogDescription>{{ finished.name }}</DialogDescription>
      </DialogHeader>
      <dl class="grid grid-cols-3 gap-3 text-center">
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('workout.summary.volume') }}</dt>
          <dd class="text-lg font-semibold">{{ formatWeight(workoutVolumeKg(finished), unit) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('workout.summary.sets') }}</dt>
          <dd class="text-lg font-semibold">{{ workoutWorkingSets(finished) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('workout.summary.duration') }}</dt>
          <dd class="text-lg font-semibold">
            {{ t('common.minutes', { n: workoutDurationMinutes(finished) }) }}
          </dd>
        </div>
      </dl>
      <DialogFooter>
        <Button @click="closeSummary">{{ t('workout.summary.done') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
