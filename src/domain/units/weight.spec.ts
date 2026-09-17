import { describe, it, expect } from 'vitest'
import { displayWeight, formatWeight, inputToKg, kgToLb, lbToKg } from './weight'

describe('weight units', () => {
  it('converts between kg and lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.46, 2)
    expect(lbToKg(220.46)).toBeCloseTo(100, 2)
  })

  it('rounds display values to sensible steps', () => {
    expect(displayWeight(80, 'kg')).toBe(80)
    expect(displayWeight(80.1, 'kg')).toBe(80)
    expect(displayWeight(80.13, 'kg')).toBe(80.25)
    expect(displayWeight(80, 'lb')).toBe(176.5)
  })

  it('stores typed input as kg with 2 decimals', () => {
    expect(inputToKg(82.5, 'kg')).toBe(82.5)
    expect(inputToKg(135, 'lb')).toBe(61.23)
  })

  it('formats with unit suffix and trims zeros', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg')
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg')
    expect(formatWeight(80, 'lb')).toBe('176.5 lb')
  })
})
