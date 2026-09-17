<script setup lang="ts">
import { RouterLink } from 'vue-router'

const tabs = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/history', label: 'Historial', icon: '📅' },
  { to: '/routines', label: 'Rutinas', icon: '📋' },
  { to: '/analytics', label: 'Análisis', icon: '📈' },
] as const
</script>

<template>
  <nav class="bottom-nav" aria-label="Navegación principal">
    <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
      <span class="icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: var(--touch-target);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.tab.router-link-active {
  color: var(--color-primary);
}

.icon {
  font-size: 1.25rem;
}
</style>
