<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)

async function submit() {
  submitting.value = true
  try {
    await auth.signUp(email.value, password.value, displayName.value)
    if (auth.isAuthenticated) {
      await router.replace({ name: 'home' })
    } else {
      toast.success(t('auth.register.created'), { description: t('auth.register.createdHint') })
      await router.replace({ name: 'auth-login' })
    }
  } catch (e) {
    toast.error(t('auth.register.failed'), {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[70dvh] items-center">
    <Card class="w-full">
      <CardHeader>
        <CardTitle class="text-2xl">{{ t('auth.register.title') }}</CardTitle>
        <CardDescription>{{ t('auth.register.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="displayName">{{ t('auth.name') }}</Label>
            <Input
              id="displayName"
              v-model="displayName"
              autocomplete="name"
              required
              maxlength="50"
            />
          </div>
          <div class="grid gap-2">
            <Label for="email">{{ t('auth.email') }}</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t('auth.password') }}</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
            />
            <p class="text-xs text-muted-foreground">{{ t('auth.passwordHint') }}</p>
          </div>
          <Button type="submit" class="w-full" :disabled="submitting">{{
            t('auth.register.submit')
          }}</Button>
        </form>
        <p class="mt-6 text-center text-sm text-muted-foreground">
          {{ t('auth.register.hasAccount') }}
          <RouterLink
            :to="{ name: 'auth-login' }"
            class="text-primary underline-offset-4 hover:underline"
          >
            {{ t('auth.register.login') }}
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
