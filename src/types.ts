// Core Types
// ----------------------------------------------------------------------------

export type UserId = string | number
export type ClubId = string | number
export type TopicId = string | number

export interface User {
  user_id: number
  name: string
  photo_url: string
  username: string

  last_active_minutes?: number | null
  bio?: string | null
  twitter?: string | null
}

export interface UserProfile extends User {
  displayname: string
  bio: string
  twitter: string
  instagram: string
  num_followers: number
  num_following: number
  time_created: string
  follows_me: boolean
  is_blocked_by_network: boolean
  mutual_follows_count: number
  mutual_follows: User[]
  notification_type: number
  invited_by_user_profile: User | null
  invited_by_club: Club | null
  clubs: Club[]
  url: string
  can_receive_direct_payment: boolean
  direct_payment_fee_rate: number
  direct_payment_fee_fixed: number
}

export interface Club {
  club_id: number
  name: string
  description: string
  photo_url: string
  num_members: number
  num_followers: number
  enable_private: boolean
  is_follow_allowed: boolean
  is_membership_private: boolean
  is_community: boolean
  rules: ClubRule[]
  url: string
  num_online: number
}

export interface ClubRule {
  desc: string
  title: string
}

export interface Topic {
  title: string
  id: number
  abbreviated_title: string
}

export interface TopLevelTopic extends Topic {
  topics: Topic[]
}

export interface Event {
  event_id: number
  name: string
  description: string
  time_start: string
  club: Club
  is_member_only: boolean
  url: string
  hosts: User[]
  channel: Channel | null
  is_expired: boolean
}

export interface Channel {
  creator_user_profile_id: number
  channel_id: number
  channel: string
  topic: string
  is_private: boolean
  is_social_mode: boolean
  url: string
  feature_flags: [string]
  club: Club | null
  club_name: string
  club_id: number
  welcome_for_user_profile: User | null
  num_other: number
  has_blocked_speakers: boolean
  is_explore_channel: boolean
  num_speakers: number
  num_all: number
  users: User[]
}

// Custom Types
// ----------------------------------------------------------------------------

export interface SocialGraphUserProfile extends UserProfile {
  following?: UserId[]
  followers?: UserId[]
  club_ids: ClubId[]
  invited_by_user_profile_id: UserId
}

export interface SocialGraph {
  [userId: string]: SocialGraphUserProfile | null
}

// API Types
// ----------------------------------------------------------------------------

export interface ClubhouseAPIResponse {
  success: boolean
}

export interface CompletePhoneNumberAuthAPIResponse
  extends ClubhouseAPIResponse {
  user_profile: User

  auth_token: string
  refresh_token: string
  access_token: string

  is_verified: boolean
  is_waitlisted: boolean
  is_onboarding: boolean
}

export interface PagedUserAPIResponse extends ClubhouseAPIResponse {
  users: User[]
  count: number
  next: number | null
  previous: number | null
}

export interface PagedClubAPIResponse extends ClubhouseAPIResponse {
  clubs: Club[]
  count: number
  next: number | null
  previous: number | null
}

export interface UserProfileAPIResponse extends ClubhouseAPIResponse {
  user_profile: UserProfile
}

export interface GetMeAPIResponse extends ClubhouseAPIResponse {
  has_unread_notifications: boolean
  actionable_notifications_count: number
  num_invites: number
  auth_token: string
  refresh_token: string
  access_token: string
  notifications_enabled: boolean
  following_ids: number[] | null
  blocked_ids: number[] | null
  is_admin: boolean
  email: string
  feature_flags: string[]
  user_profile: User
}

export interface WaitlistStatusAPIResponse extends ClubhouseAPIResponse {
  is_waitlisted: boolean
  is_onboarding: boolean
  analytics_properties: {
    SignUpWeek: string
    SignUpDay: string
  }
  enable_twitter: boolean
  num_preselect_follows: number
  invited_by_user_profile: User | null
  club: Club | null
}

export interface GetClubAPIResponse extends ClubhouseAPIResponse {
  club: Club
  is_admin: boolean
  is_member: boolean
  is_follower: boolean
  is_pending_accept: boolean
  is_pending_approval: boolean
  added_by_user_profile: User | null
  member_user_ids: string[]
  num_invites: number
  invite_link: string | null
  topics: Topic[]
}

export interface GetAllTopicsAPIResponse extends ClubhouseAPIResponse {
  topics: TopLevelTopic[]
}

export interface GetTopicAPIResponse extends ClubhouseAPIResponse {
  topic: Topic | TopLevelTopic
}

export interface GetChannelsAPIResponse extends ClubhouseAPIResponse {
  channels: Channel[]
  events: Event[]
}

export interface JoinChannelAPIResponse extends ClubhouseAPIResponse {
  creator_user_profile_id: number
  channel_id: number
  channel: string
  topic: string
  is_private: boolean
  is_social_mode: boolean
  url: string
  feature_flags: [string]
  club: Club
  club_name: string
  club_id: number
  welcome_for_user_profile: User | null
  is_handraise_enabled: boolean
  handraise_permission: number
  is_club_member: boolean
  is_club_admin: boolean
  users: User[]
  success: boolean
  is_empty: boolean
  token: string
  rtm_token: string
  pubnub_token: string
  pubnub_origin: string
  pubnub_heartbeat_value: number
  pubnub_heartbeat_interval: number
  pubnub_enable: boolean
  agora_native_mute: boolean
}
