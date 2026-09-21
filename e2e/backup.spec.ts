import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('export downloads a backup and import adds its content', async ({ page }) => {
  await signUpFresh(page)

  // Create something to export.
  await page.goto('/exercises')
  await page.getByRole('button', { name: 'Nuevo' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Nombre').fill('Remo especial')
  await sheet.getByRole('button', { name: 'Crear' }).click()
  await expect(sheet).toBeHidden()

  await page.goto('/settings')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar datos (JSON)' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^gym-tracking-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await download.path()
  const json = JSON.parse(await (await import('node:fs/promises')).readFile(path!, 'utf8'))
  expect(json.exercises.map((e: { name: string }) => e.name)).toEqual(['Remo especial'])

  // Import the same file back: the custom exercise is duplicated (new id).
  await page.getByTestId('backup-file').setInputFiles(path!)
  const dialog = page.getByRole('dialog', { name: '¿Importar esta copia?' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('1 ejercicios')
  await dialog.getByRole('button', { name: 'Importar datos' }).click()
  await expect(dialog).toBeHidden()

  await page.goto('/exercises')
  await page.getByLabel('Buscar ejercicio').fill('Remo especial')
  await expect(page.getByRole('listitem').filter({ hasText: 'Remo especial' })).toHaveCount(2)
})
