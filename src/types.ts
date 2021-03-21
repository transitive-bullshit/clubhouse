export type UserId = string | number

export interface ClubhouseAPIResponse {
  success: boolean
}

export interface CompletePhoneNumberAuthAPIResponse
  extends ClubhouseAPIResponse {
  user_profile: {
    user_id: number
    name: string
    photo_url: string
    username: string
  }

  auth_token: string
  refresh_token: string
  access_token: string

  is_verified: boolean
  is_waitlisted: boolean
  is_onboarding: boolean
}
