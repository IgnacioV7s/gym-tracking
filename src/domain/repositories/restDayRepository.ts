export interface RestDayRepository {
  /** yyyy-MM-dd keys within [from, to] inclusive. */
  listBetween(from: string, to: string): Promise<string[]>
  add(date: string): Promise<void>
  remove(date: string): Promise<void>
}
