import type { Routine, RoutineInput } from '@/domain/models'

export interface RoutineRepository {
  list(): Promise<Routine[]>
  get(id: string): Promise<Routine | null>
  create(input: RoutineInput): Promise<Routine>
  /** Replaces the routine's exercise list entirely. */
  update(id: string, input: RoutineInput): Promise<Routine>
  remove(id: string): Promise<void>
}
