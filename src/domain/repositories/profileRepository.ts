import type { Profile, ProfileUpdate } from '@/domain/models'

export interface ProfileRepository {
  /** Profile of the signed-in user. */
  getCurrent(): Promise<Profile>
  updateCurrent(changes: ProfileUpdate): Promise<Profile>
}
