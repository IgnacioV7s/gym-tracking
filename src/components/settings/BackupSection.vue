<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { Download, Upload } from '@lucide/vue'
import type { Backup } from '@/domain/schemas/backup'
import { exportBackup, importBackup, parseBackup } from '@/data/backup'
import { supabase } from '@/lib/supabase'
import { useProfileStore } from '@/stores/profile'
import { useExercisesStore } from '@/stores/exercises'
import { useRoutinesStore } from '@/stores/routines'
import { useWorkoutsStore } from '@/stores/workouts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const { t } = useI18n()
const profileStore = useProfileStore()
const exercisesStore = useExercisesStore()
const routinesStore = useRoutinesStore()
const workoutsStore = useWorkoutsStore()

const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pending = ref<Backup | null>(null)

async function doExport() {
  busy.value = true
  try {
    const backup = await exportBackup(supabase)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracking-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('backup.exported'))
  } catch (e) {
    toast.error(t('backup.couldNotExport'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    pending.value = parseBackup(await file.text())
  } catch {
    toast.error(t('backup.invalidFile'))
  }
}

async function confirmImport() {
  if (!pending.value) return
  busy.value = true
  try {
    const result = await importBackup(supabase, pending.value)
    pending.value = null
    await Promise.all([profileStore.load(), exercisesStore.load(true), routinesStore.load(true)])
    workoutsStore.invalidate()
    toast.success(t('backup.imported', { ...result }))
  } catch (e) {
    toast.error(t('backup.couldNotImport'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="grid gap-2" :aria-label="t('backup.title')">
    <h2 class="text-sm font-medium">{{ t('backup.title') }}</h2>
    <Button variant="outline" :disabled="busy" @click="doExport">
      <Download class="size-4" />
      {{ t('backup.export') }}
    </Button>
    <Button variant="outline" :disabled="busy" @click="fileInput?.click()">
      <Upload class="size-4" />
      {{ t('backup.import') }}
    </Button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      data-testid="backup-file"
      @change="onFile"
    />
    <p class="text-xs text-muted-foreground">{{ t('backup.importHint') }}</p>

    <Dialog :open="pending !== null" @update:open="(v) => !v && (pending = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('backup.confirmTitle') }}</DialogTitle>
          <DialogDescription>
            {{
              t('backup.confirmDescription', {
                exercises: pending?.exercises.length ?? 0,
                routines: pending?.routines.length ?? 0,
                workouts: pending?.workouts.length ?? 0,
              })
            }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="pending = null">{{ t('common.cancel') }}</Button>
          <Button :disabled="busy" @click="confirmImport">{{ t('backup.import') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
