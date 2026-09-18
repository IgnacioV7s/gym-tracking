import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('cardio sets log minutes and km; finishing a session starts the streak', async ({ page }) => {
  await signUpFresh(page)

  const streak = page.getByTestId('streak-card')
  await expect(streak).toContainText('Sin racha activa')

  // Mark today as rest, then unmark it.
  await streak.getByRole('button', { name: 'Hoy descanso' }).click()
  await expect(streak).toContainText('Hoy es día de descanso')
  await streak.getByRole('button', { name: 'Quitar descanso de hoy' }).click()
  await expect(streak).toContainText('Sin racha activa')

  // Cardio session.
  await page.getByRole('button', { name: 'Empezar entrenamiento libre' }).click()
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('cinta')
  await picker.getByRole('button', { name: 'Cinta de correr', exact: true }).click()

  const block = page.getByRole('region', { name: 'Cinta de correr' })
  await expect(block).toContainText('Min')
  await block.getByLabel('Duración serie 1 (minutos)').fill('20')
  await block.getByLabel('Distancia serie 1 (km)').fill('3.5')
  await block.getByLabel('Completar serie 1').click()
  await page.getByRole('button', { name: 'Saltar descanso' }).click()

  await page.getByRole('button', { name: 'Finalizar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click()
  await page
    .getByRole('dialog', { name: 'Sesión completada' })
    .getByRole('button', { name: 'Listo' })
    .click()

  await expect(page).toHaveURL('/')
  await expect(streak).toContainText('Llevas 1 día seguido')
  await expect(streak).toContainText('Hoy ya entrenaste')

  // Analytics shows cardio totals.
  await page.goto('/analytics')
  await expect(page.getByText('20 min', { exact: true })).toBeVisible()
  await expect(page.getByText('3.5 km', { exact: true })).toBeVisible()

  // Streak survives a reload (persisted server-side).
  await page.goto('/')
  await expect(streak).toContainText('Llevas 1 día seguido')
})
