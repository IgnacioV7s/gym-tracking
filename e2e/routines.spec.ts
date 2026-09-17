import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('create a routine and start a pre-filled workout from it', async ({ page }) => {
  await signUpFresh(page)

  await page.goto('/routines')
  await page.getByRole('link', { name: 'Crear la primera' }).click()
  await expect(page).toHaveURL('/routines/new')

  await page.getByLabel('Nombre').fill('Push A')

  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  let picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('banca')
  await picker.getByRole('button', { name: 'Press de banca', exact: true }).click()

  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('laterales')
  await picker.getByRole('button', { name: 'Elevaciones laterales', exact: true }).click()

  const first = page.getByTestId('routine-item-0')
  await first.getByLabel('Series').fill('4')
  await first.getByLabel('Reps').fill('6')
  await first.getByLabel('kg').fill('70')

  // Move the second exercise to the top, then save.
  await page.getByTestId('routine-item-1').getByRole('button', { name: 'Subir' }).click()
  await expect(page.getByTestId('routine-item-0')).toContainText('Elevaciones laterales')

  await page.getByRole('button', { name: 'Guardar rutina' }).click()
  await expect(page).toHaveURL('/routines')
  await expect(page.getByText('Push A')).toBeVisible()
  await expect(page.getByText('2 ejercicios')).toBeVisible()

  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page).toHaveURL('/workout')
  await expect(page.getByRole('heading', { name: 'Push A' })).toBeVisible()

  const bench = page.getByRole('region', { name: 'Press de banca' })
  await expect(bench.getByLabel('Peso serie 4 (kg)')).toHaveValue('70')
  await expect(bench.getByLabel('Repeticiones serie 1')).toHaveValue('6')
  const laterals = page.getByRole('region', { name: 'Elevaciones laterales' })
  await expect(laterals.getByLabel('Repeticiones serie 3')).toHaveValue('10')
})
