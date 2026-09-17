import type { Tables, TablesUpdate } from '@/types/database'
import type { Profile, ProfileUpdate } from '@/domain/models'

type ProfileRow = Tables<'profiles'>

export function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    weightUnit: row.weight_unit as Profile['weightUnit'],
    theme: row.theme as Profile['theme'],
    defaultRestSeconds: row.default_rest_seconds,
    oneRepMaxFormula: row.one_rep_max_formula as Profile['oneRepMaxFormula'],
  }
}

export function profileToRowUpdate(changes: ProfileUpdate): TablesUpdate<'profiles'> {
  const row: TablesUpdate<'profiles'> = {}
  if (changes.displayName !== undefined) row.display_name = changes.displayName
  if (changes.weightUnit !== undefined) row.weight_unit = changes.weightUnit
  if (changes.theme !== undefined) row.theme = changes.theme
  if (changes.defaultRestSeconds !== undefined) row.default_rest_seconds = changes.defaultRestSeconds
  if (changes.oneRepMaxFormula !== undefined) row.one_rep_max_formula = changes.oneRepMaxFormula
  return row
}
