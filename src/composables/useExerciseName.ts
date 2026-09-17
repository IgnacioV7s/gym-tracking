import { useI18n } from 'vue-i18n'
import { exerciseName, type Exercise } from '@/domain/models'
import { useExercisesStore } from '@/stores/exercises'

/** Locale-aware exercise names, by object or by id. */
export function useExerciseName() {
  const { locale, t } = useI18n()
  const store = useExercisesStore()

  function nameOf(exercise: Pick<Exercise, 'name' | 'nameEn'>): string {
    return exerciseName(exercise, locale.value)
  }

  function nameById(id: string): string {
    const exercise = store.byId.get(id)
    return exercise ? nameOf(exercise) : t('exercises.fallbackName')
  }

  return { nameOf, nameById }
}
