import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('switching the language in settings translates the UI and the catalog', async ({ page }) => {
  await signUpFresh(page)
  await expect(page.getByRole('heading', { name: 'Hola, Tester' })).toBeVisible()

  await page.goto('/settings')
  await page.getByLabel('Idioma').selectOption('en')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.goto('/exercises')
  await expect(page.getByText('Bench press', { exact: true })).toBeVisible()
  await expect(page.getByText('Press de banca', { exact: true })).toBeHidden()

  // Preference persists across reloads.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Exercises' })).toBeVisible()

  await page.goto('/settings')
  await page.getByLabel('Language').selectOption('es')
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible()
})
