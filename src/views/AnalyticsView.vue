<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <h1 class="text-2xl font-semibold tracking-tight">{{ t('nav.analytics') }}</h1>
</template>
