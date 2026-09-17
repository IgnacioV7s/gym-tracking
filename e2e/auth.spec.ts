import { test, expect } from '@playwright/test'

// Runs against the local Supabase stack (pnpm db:start). Email confirmation is
// disabled locally, so sign-up creates an active session immediately.
test('sign up, reach a protected route, sign out and sign in again', async ({ page }) => {
  const email = `e2e-${Date.now()}@test.local`
  const password = 'secret123'

  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)

  await page.getByRole('link', { name: 'Regístrate' }).click()
  await page.getByLabel('Nombre').fill('Tester')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Hola, Tester' })).toBeVisible()

  await page.getByRole('link', { name: 'Ajustes' }).click()
  await expect(page.getByText(`Sesión iniciada como ${email}`)).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)settings/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/settings')
})
