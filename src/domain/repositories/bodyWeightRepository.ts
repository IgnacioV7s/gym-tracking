export interface BodyWeightEntry {
  /** yyyy-MM-dd */
  date: string
  weightKg: number
}

export interface BodyWeightRepository {
  listBetween(from: string, to: string): Promise<BodyWeightEntry[]>
  /** Inserts or replaces the entry for that day. */
  set(entry: BodyWeightEntry): Promise<void>
  remove(date: string): Promise<void>
}
