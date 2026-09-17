<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      toast.success('Cuenta creada', { description: 'Revisa tu correo para confirmarla.' })
      await router.replace({ name: 'auth-login' })
    }
  } catch (e) {
    toast.error('No se pudo crear la cuenta', {
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
        <CardTitle class="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Empieza a registrar tu progreso.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="displayName">Nombre</Label>
            <Input id="displayName" v-model="displayName" autocomplete="name" required maxlength="50" />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" autocomplete="email" inputmode="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="password">Contraseña</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
            />
            <p class="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
          </div>
          <Button type="submit" class="w-full" :disabled="submitting">Crear cuenta</Button>
        </form>
        <p class="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?
          <RouterLink :to="{ name: 'auth-login' }" class="text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
