import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('create a custom exercise, find it by search and archive it', async ({ page }) => {
  await signUpFresh(page)
  await page.goto('/exercises')

  // Global catalog is visible.
  await expect(page.getByText('Press de banca', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Nuevo' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Nombre').fill('Remo Pendlay')
  await sheet.getByLabel('Músculo principal').selectOption('back')
  await sheet.getByLabel('Equipo', { exact: true }).selectOption('barbell')
  await sheet.getByRole('button', { name: 'Bíceps' }).click()
  await sheet.getByRole('button', { name: 'Crear' }).click()
  await expect(sheet).toBeHidden()

  await page.getByLabel('Buscar ejercicio').fill('pendlay')
  const row = page.getByRole('listitem').filter({ hasText: 'Remo Pendlay' })
  await expect(row).toBeVisible()
  await expect(row.getByText('Propio')).toBeVisible()
  await expect(page.getByText('Press de banca', { exact: true })).toBeHidden()

  await row.getByRole('button', { name: 'Archivar Remo Pendlay' }).click()
  await expect(row).toBeHidden()

  await page.getByLabel('Mostrar archivados').click()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Restaurar Remo Pendlay' }).click()
  await expect(row.getByRole('button', { name: 'Archivar Remo Pendlay' })).toBeVisible()
})
