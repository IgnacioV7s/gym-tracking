import type { WeightUnit } from '@/domain/models'

const LB_PER_KG = 2.2046226218

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

/** Converts a stored kg value to the display unit, rounded to 0.5 (lb) or 0.25 (kg). */
export function displayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? Math.round(kgToLb(kg) * 2) / 2 : Math.round(kg * 4) / 4
}

/** Converts a user-typed value in the display unit to kg for storage (2 decimals). */
export function inputToKg(value: number, unit: WeightUnit): number {
  const kg = unit === 'lb' ? lbToKg(value) : value
  return Math.round(kg * 100) / 100
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  const n = displayWeight(kg, unit)
  return `${Number.isInteger(n) ? n : n.toFixed(unit === 'lb' ? 1 : 2).replace(/\.?0+$/, '')} ${unit}`
}
