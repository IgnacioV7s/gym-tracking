import { describe, it, expect } from 'vitest'
import { profileFromRow, profileToRowUpdate } from './profile'

describe('profile mappers', () => {
  it('maps a row to the domain model', () => {
    const profile = profileFromRow({
      id: 'u1',
      display_name: 'Ana',
      weight_unit: 'lb',
      theme: 'dark',
      default_rest_seconds: 120,
      one_rep_max_formula: 'brzycki',
      locale: 'en',
      onboarded_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })
    expect(profile).toEqual({
      id: 'u1',
      displayName: 'Ana',
      weightUnit: 'lb',
      theme: 'dark',
      defaultRestSeconds: 120,
      oneRepMaxFormula: 'brzycki',
      locale: 'en',
      onboardedAt: null,
    })
  })

  it('only includes changed fields in the row update', () => {
    expect(profileToRowUpdate({ theme: 'light', defaultRestSeconds: 60 })).toEqual({
      theme: 'light',
      default_rest_seconds: 60,
    })
    expect(profileToRowUpdate({})).toEqual({})
  })
})
