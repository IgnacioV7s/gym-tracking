export type WeightUnit = 'kg' | 'lb'
export type Theme = 'system' | 'light' | 'dark'
export type OneRepMaxFormula = 'epley' | 'brzycki'
export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export interface Profile {
  id: string
  displayName: string | null
  weightUnit: WeightUnit
  theme: Theme
  defaultRestSeconds: number
  oneRepMaxFormula: OneRepMaxFormula
  locale: Locale
  /** ISO timestamp when the first-run tutorial was completed or skipped. */
  onboardedAt: string | null
}

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>
