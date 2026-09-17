import type { Page } from '@playwright/test'

/** Creates a fresh account through the UI and lands on the home page. */
export async function signUpFresh(page: Page, displayName = 'Tester') {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`
  const password = 'secret123'
  await page.goto('/register')
  await page.getByLabel('Nombre').fill(displayName)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.waitForURL('/')
  return { email, password }
}
