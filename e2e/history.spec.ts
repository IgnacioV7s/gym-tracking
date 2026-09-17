import { test, expect } from '@playwright/test'
import { signUpFresh } from './helpers'

test('a finished workout shows up in history, analytics and exercise detail', async ({ page }) => {
  await signUpFresh(page)

  // Log a quick session: bench 100 kg x 5, completed.
  await page.getByRole('button', { name: 'Empezar entrenamiento libre' }).click()
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Buscar ejercicio para agregar').fill('banca')
  await picker.getByRole('button', { name: 'Press de banca', exact: true }).click()
  const block = page.getByRole('region', { name: 'Press de banca' })
  await block.getByLabel('Peso serie 1 (kg)').fill('100')
  await block.getByLabel('Repeticiones serie 1').fill('5')
  await block.getByLabel('Completar serie 1').click()
  await page.getByRole('button', { name: 'Saltar descanso' }).click()
  await page.getByRole('button', { name: 'Finalizar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click()
  await page
    .getByRole('dialog', { name: 'Sesión completada' })
    .getByRole('button', { name: 'Listo' })
    .click()

  // History: calendar marks today and the list shows the session.
  await page.goto('/history')
  const today = new Date().getDate()
  const calendar = page.getByRole('grid', { name: 'Calendario de entrenamientos' })
  await expect(calendar.getByRole('gridcell', { name: /^Entrenaste el/ })).toHaveText(String(today))
  const row = page.getByRole('link', { name: /Entrenamiento/ }).first()
  await expect(row).toContainText('500 kg')

  // Detail shows the set and allows renaming.
  await row.click()
  await expect(page).toHaveURL(/\/history\//)
  await expect(page.getByRole('region', { name: 'Press de banca' })).toContainText('100 kg')
  await page.getByLabel('Nombre').fill('Pecho pesado')
  await page.getByLabel('Nombre').press('Tab')
  await expect(page.getByRole('heading', { name: 'Pecho pesado' })).toBeVisible()

  // Analytics for the current month.
  await page.goto('/analytics')
  await expect(page.getByText('Sesiones', { exact: true })).toBeVisible()
  await expect(page.getByText('500 kg', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Volumen por semana' })).toBeVisible()
  const record = page.getByRole('link', { name: /Press de banca/ })
  await expect(record).toContainText('100 kg × 5')

  // Exercise detail with 1RM (epley: 100 * (1 + 5/30) = 116.67).
  await record.click()
  await expect(page).toHaveURL(/\/exercises\//)
  await expect(page.getByText('116.75 kg', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: '1RM estimado por sesión' })).toBeVisible()
})
