import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('sets logged with no connection are saved once it returns', async ({ page, context }) => {
  await signUpFresh(page)

  await page.getByRole('button', { name: 'Empezar entrenamiento libre' }).click()
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('banca')
  await picker.getByRole('button', { name: 'Press de banca', exact: true }).click()

  const block = page.getByRole('region', { name: 'Press de banca' })
  await block.getByLabel('Peso serie 1 (kg)').fill('90')
  await block.getByLabel('Repeticiones serie 1').fill('6')
  await block.getByLabel('Completar serie 1').click()
  await page.getByRole('button', { name: 'Saltar descanso' }).click()

  // Pull the plug: the session must stay usable.
  await context.setOffline(true)
  await expect(page.getByRole('status').filter({ hasText: 'Sin conexión' })).toBeVisible()

  await block.getByRole('button', { name: 'Agregar serie' }).click()
  await block.getByLabel('Peso serie 2 (kg)').fill('95')
  await block.getByLabel('Completar serie 2').click()
  await expect(page.getByRole('status').filter({ hasText: 'cambios sin enviar' })).toBeVisible()
  await expect(block.getByLabel('Desmarcar serie 2')).toBeVisible()

  // Back online: the queue drains on its own.
  await context.setOffline(false)
  await expect(page.getByRole('status').filter({ hasText: 'Sin conexión' })).toBeHidden({
    timeout: 20_000,
  })
  await expect(page.getByRole('status').filter({ hasText: 'cambios' })).toBeHidden({
    timeout: 20_000,
  })

  // The server really has both sets: a reload rebuilds the session from it.
  await page.reload()
  await expect(page).toHaveURL('/workout')
  const reloaded = page.getByRole('region', { name: 'Press de banca' })
  await expect(reloaded.getByLabel('Peso serie 1 (kg)')).toHaveValue('90')
  await expect(reloaded.getByLabel('Peso serie 2 (kg)')).toHaveValue('95')
  await expect(reloaded.getByLabel('Desmarcar serie 2')).toBeVisible()
})
