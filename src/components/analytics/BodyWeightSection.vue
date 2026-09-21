<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import type { WeightUnit } from '@/domain/models'
import type { Period } from '@/domain/analytics'
import type { BodyWeightEntry } from '@/domain/repositories'
import { displayWeight, formatWeight, inputToKg } from '@/domain/units/weight'
import { dateFnsLocale } from '@/i18n'
import { repositories } from '@/data/repositories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LineChart from '@/components/charts/LineChart.vue'

const props = defineProps<{ period: Period; unit: WeightUnit }>()
const { t } = useI18n()

const entries = ref<BodyWeightEntry[]>([])
const input = ref('')
const saving = ref(false)

async function load() {
  entries.value = await repositories.bodyWeights.listBetween(
    format(props.period.from, 'yyyy-MM-dd'),
    format(props.period.to, 'yyyy-MM-dd'),
  )
}
watch(() => props.period, load, { immediate: true })

async function save() {
  const n = Number(input.value)
  if (!Number.isFinite(n) || n <= 0) return
  saving.value = true
  try {
    await repositories.bodyWeights.set({
      date: format(new Date(), 'yyyy-MM-dd'),
      weightKg: inputToKg(n, props.unit),
    })
    input.value = ''
    await load()
    toast.success(t('analytics.bodyWeight.saved'))
  } catch (e) {
    toast.error(t('common.couldNotSave'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    saving.value = false
  }
}

const labels = computed(() =>
  entries.value.map((e) =>
    format(new Date(`${e.date}T00:00:00`), 'd MMM', { locale: dateFnsLocale() }),
  ),
)
const values = computed(() => entries.value.map((e) => displayWeight(e.weightKg, props.unit)))
const latest = computed(() => entries.value.at(-1))
const change = computed(() => {
  const first = entries.value[0]
  const last = latest.value
  if (!first || !last || first === last) return null
  const d = displayWeight(last.weightKg, props.unit) - displayWeight(first.weightKg, props.unit)
  return `${d > 0 ? '+' : ''}${Math.round(d * 10) / 10} ${props.unit}`
})
const fmt = (v: number) => `${v} ${props.unit}`
</script>

<template>
  <section class="mt-6" :aria-label="t('analytics.bodyWeight.title')">
    <h2 class="mb-2 text-sm font-medium">{{ t('analytics.bodyWeight.title') }}</h2>
    <form class="mb-2 flex items-end gap-2" @submit.prevent="save">
      <div class="grid flex-1 gap-1">
        <Label for="bw" class="text-xs">{{ t('analytics.bodyWeight.today', { unit }) }}</Label>
        <Input id="bw" v-model="input" type="number" inputmode="decimal" min="1" step="0.1" />
      </div>
      <Button type="submit" :disabled="saving || !input">{{
        t('analytics.bodyWeight.save')
      }}</Button>
    </form>
    <div class="rounded-xl border bg-card p-3">
      <p v-if="entries.length === 0" class="text-sm text-muted-foreground">
        {{ t('analytics.bodyWeight.empty') }}
      </p>
      <template v-else>
        <p class="mb-2 text-sm">
          <span class="font-semibold">
            {{ t('analytics.bodyWeight.latest', { value: formatWeight(latest!.weightKg, unit) }) }}
          </span>
          <span v-if="change" class="text-muted-foreground">
            · {{ t('analytics.bodyWeight.change', { delta: change }) }}
          </span>
        </p>
        <LineChart
          :labels="labels"
          :values="values"
          :format="fmt"
          :title="t('analytics.bodyWeight.chart')"
        />
      </template>
    </div>
  </section>
</template>
