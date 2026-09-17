import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Profile, ProfileUpdate, Theme } from '@/domain/models'
import type { ProfileRepository } from '@/domain/repositories'
import { repositories } from '@/data/repositories'

export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

export function createProfileStore(repo: ProfileRepository) {
  return defineStore('profile', () => {
    const profile = ref<Profile | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    watch(
      () => profile.value?.theme ?? 'system',
      (theme) => applyTheme(theme),
      { immediate: true },
    )

    async function load() {
      loading.value = true
      error.value = null
      try {
        profile.value = await repo.getCurrent()
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      } finally {
        loading.value = false
      }
    }

    async function update(changes: ProfileUpdate) {
      profile.value = await repo.updateCurrent(changes)
    }

    function reset() {
      profile.value = null
      error.value = null
    }

    return { profile, loading, error, load, update, reset }
  })
}

export const useProfileStore = createProfileStore(repositories.profile)
