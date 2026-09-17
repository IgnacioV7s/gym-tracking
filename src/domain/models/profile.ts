export type WeightUnit = 'kg' | 'lb'
export type Theme = 'system' | 'light' | 'dark'
export type OneRepMaxFormula = 'epley' | 'brzycki'

export interface Profile {
  id: string
  displayName: string | null
  weightUnit: WeightUnit
  theme: Theme
  defaultRestSeconds: number
  oneRepMaxFormula: OneRepMaxFormula
}

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>
