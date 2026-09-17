<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, CalendarDays, ClipboardList, TrendingUp } from '@lucide/vue'

const { t } = useI18n()

const tabs = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/history', key: 'nav.history', icon: CalendarDays },
  { to: '/routines', key: 'nav.routines', icon: ClipboardList },
  { to: '/analytics', key: 'nav.analytics', icon: TrendingUp },
] as const
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 flex border-t bg-background pb-[env(safe-area-inset-bottom,0px)]"
    :aria-label="t('nav.main')"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground [&.router-link-exact-active]:text-primary"
    >
      <component :is="tab.icon" class="size-5" aria-hidden="true" />
      <span>{{ t(tab.key) }}</span>
    </RouterLink>
  </nav>
</template>
