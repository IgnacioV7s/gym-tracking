<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function submit() {
  submitting.value = true
  try {
    await auth.signIn(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    toast.error('No se pudo iniciar sesión', {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    submitting.value = false
  }
}

async function magicLink() {
  if (!email.value) {
    toast.error('Escribe tu email primero')
    return
  }
  submitting.value = true
  try {
    await auth.signInWithMagicLink(email.value)
    toast.success('Te enviamos un enlace de acceso', { description: 'Revisa tu correo.' })
  } catch (e) {
    toast.error('No se pudo enviar el enlace', {
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
        <CardTitle class="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Entra para ver tus entrenamientos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
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
            <Label for="password">Contraseña</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              minlength="6"
            />
          </div>
          <Button type="submit" class="w-full" :disabled="submitting">Entrar</Button>
          <Button
            type="button"
            variant="outline"
            class="w-full"
            :disabled="submitting"
            @click="magicLink"
          >
            Enviarme un enlace mágico
          </Button>
        </form>
        <p class="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?
          <RouterLink :to="{ name: 'auth-register' }" class="text-primary underline-offset-4 hover:underline">
            Regístrate
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
