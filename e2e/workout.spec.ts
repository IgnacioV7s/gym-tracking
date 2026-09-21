import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('free workout: add exercise, log sets, resume after reload, finish with summary', async ({
  page,
}) => {
  await signUpFresh(page)

  await page.getByRole('button', { name: 'Empezar entrenamiento libre' }).click()
  await expect(page).toHaveURL('/workout')

  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('banca')
  await picker.getByRole('button', { name: 'Press de banca', exact: true }).click()

  const block = page.getByRole('region', { name: 'Press de banca' })
  await expect(block).toBeVisible()

  // First set is created automatically; fill it and complete it.
  await block.getByLabel('Peso serie 1 (kg)').fill('80')
  await block.getByLabel('Repeticiones serie 1').fill('8')
  await block.getByLabel('Completar serie 1').click()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible()
  await page.getByRole('button', { name: 'Saltar descanso' }).click()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeHidden()

  // Second set copies the first.
  await block.getByRole('button', { name: 'Agregar serie' }).click()
  await expect(block.getByLabel('Peso serie 2 (kg)')).toHaveValue('80')
  await expect(block.getByLabel('Repeticiones serie 2')).toHaveValue('8')
  const completed = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/workout_sets') && r.request().method() === 'PATCH',
  )
  await block.getByLabel('Completar serie 2').click()
  await completed

  // Session survives a reload.
  await page.reload()
  await expect(page).toHaveURL('/workout')
  await expect(page.getByRole('region', { name: 'Press de banca' })).toBeVisible()
  await expect(page.getByLabel('Desmarcar serie 1')).toBeVisible()
  await expect(page.getByLabel('Desmarcar serie 2')).toBeVisible()

  await page.getByRole('button', { name: 'Finalizar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click()

  const summary = page.getByRole('dialog', { name: 'Sesión completada' })
  await expect(summary).toBeVisible()
  await expect(summary.getByText('1280 kg')).toBeVisible()
  await summary.getByRole('button', { name: 'Listo' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Empezar entrenamiento libre' })).toBeVisible()
})
