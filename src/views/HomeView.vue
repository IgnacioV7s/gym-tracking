<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Settings } from '@lucide/vue'
import { useProfileStore } from '@/stores/profile'
import { Button } from '@/components/ui/button'

const profileStore = useProfileStore()
</script>

<template>
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold tracking-tight">
      Hola{{ profileStore.profile?.displayName ? `, ${profileStore.profile.displayName}` : '' }}
    </h1>
    <Button variant="ghost" size="icon" as-child>
      <RouterLink :to="{ name: 'settings' }" aria-label="Ajustes">
        <Settings class="size-5" />
      </RouterLink>
    </Button>
  </header>
</template>
