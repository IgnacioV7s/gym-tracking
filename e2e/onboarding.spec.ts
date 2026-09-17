import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('tutorial shows once after sign-up and can be replayed from settings', async ({ page }) => {
  await signUpFresh(page, 'Tester', { keepOnboarding: true })

  const dialog = page.getByRole('dialog', { name: 'Bienvenido a Gym Tracking' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Paso 1 de 4')).toBeVisible()

  await dialog.getByRole('button', { name: 'Siguiente' }).click()
  await dialog.getByRole('button', { name: 'Siguiente' }).click()
  await dialog.getByRole('button', { name: 'Siguiente' }).click()
  await expect(dialog.getByText('Paso 4 de 4')).toBeVisible()
  await dialog.getByRole('button', { name: '¡A entrenar!' }).click()
  await expect(dialog).toBeHidden()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Hola, Tester' })).toBeVisible()
  await expect(dialog).toBeHidden()

  await page.goto('/settings')
  await page.getByRole('button', { name: 'Ver tutorial' }).click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Omitir' }).click()
  await expect(dialog).toBeHidden()
})
