import type { Exercise, ExerciseInput } from '@/domain/models'

export interface ExerciseRepository {
  /** Global catalog + the user's own exercises (archived included). */
  list(): Promise<Exercise[]>
  create(input: ExerciseInput): Promise<Exercise>
  update(id: string, input: ExerciseInput): Promise<Exercise>
  archive(id: string): Promise<Exercise>
  unarchive(id: string): Promise<Exercise>
}
