<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Home, CalendarDays, ClipboardList, TrendingUp } from '@lucide/vue'

const tabs = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/history', label: 'Historial', icon: CalendarDays },
  { to: '/routines', label: 'Rutinas', icon: ClipboardList },
  { to: '/analytics', label: 'Análisis', icon: TrendingUp },
] as const
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 flex border-t bg-background pb-[env(safe-area-inset-bottom,0px)]"
    aria-label="Navegación principal"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground [&.router-link-exact-active]:text-primary"
    >
      <component :is="tab.icon" class="size-5" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
