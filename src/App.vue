<script setup lang="ts">
import { RouterView } from 'vue-router'
import BottomNav from '@/components/ui/BottomNav.vue'
</script>

<template>
  <main class="page">
    <RouterView />
  </main>
  <BottomNav />
</template>
