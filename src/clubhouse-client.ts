import got, { OptionsOfJSONResponseBody } from 'got'
import pThrottle from 'p-throttle'
import { v4 as uuidv4 } from 'uuid'

import {
  UserId,
  ClubId,
  TopicId,
  User,
  GetMeAPIResponse,
  UserProfileAPIResponse,
  PagedUserAPIResponse,
  PagedClubAPIResponse,
  WaitlistStatusAPIResponse,
  GetClubAPIResponse,
  GetAllTopicsAPIResponse,
  ClubhouseAPIResponse,
  GetTopicAPIResponse,
  GetChannelsAPIResponse,
  JoinChannelAPIResponse
} from './types'

const MAX_PAGE_SIZE = 400
const noop = () => undefined

export interface ClubhouseClientConfig {
  deviceId?: string
  userId?: UserId
  authToken?: string
  apiBaseUrl?: string
  appBuild?: string
  appVersion?: string
  throttle?: {
    limit: number
    interval: number
  } | null
  log?: any
  headers?: any
}

export interface ClubhouseClientFetchParams {
  endpoint: string
  method?: string
  auth?: boolean
  body?: any
  gotOptions?: OptionsOfJSONResponseBody
  headers?: any
  [key: string]: any
}

export type ClubhouseClientFetch<T> = (
  params: ClubhouseClientFetchParams
) => Promise<T>

export class ClubhouseClient {
  _apiBaseUrl: string = ''
  _headers: any = {}

  _deviceId: string = null
  _userId: UserId = null
  _authToken: string = null

  _fetch: ClubhouseClientFetch<any>
  _log: any

  constructor(opts: ClubhouseClientConfig = {}) {
    const {
      deviceId = uuidv4().toUpperCase(),
      userId,
      authToken,
      apiBaseUrl = 'https://www.clubhouseapi.com/api',
      appBuild = '304',
      appVersion = '0.1.28',
      throttle = {
        limit: 1,
        interval: 3500
      },
      headers,
      log = console.error.bind(console)
    } = opts

    this._apiBaseUrl = apiBaseUrl
    // 'https://api.hipster.house/api'

    this._deviceId = deviceId
    this._userId = userId
    this._authToken = authToken

    // throttle clubhouse API calls to mitigate rate limiting
    this._fetch = throttle ? pThrottle(throttle)(this.__fetch) : this.__fetch

    this._log = log || noop

    this._headers = {
      'ch-appbuild': appBuild,
      'ch-appversion': appVersion,
      'ch-languages': 'en-US',
      'ch-locale': 'en_US',
      'user-agent': `clubhouse/${appVersion} (iPhone; iOS 13.5.1; Scale/3.00)`,
      ...headers
    }
  }

  get isAuthenticated() {
    return this._authToken && this._deviceId && this._userId
  }

  get log() {
    return this._log
  }

  async startPhoneNumberAuth(phoneNumber: string) {
    return this._fetch({
      auth: false,
      endpoint: `/start_phone_number_auth`,
      method: 'POST',
      body: {
        phone_number: phoneNumber
      }
    })
  }

  async resendPhoneNumberAuth(phoneNumber: string) {
    return this._fetch({
      auth: false,
      endpoint: `/resend_phone_number_auth`,
      method: 'POST',
      body: {
        phone_number: phoneNumber
      }
    })
  }

  async completePhoneNumberAuth(phoneNumber: string, verificationCode: string) {
    return this._fetch({
      auth: false,
      endpoint: `/complete_phone_number_auth`,
      method: 'POST',
      body: {
        phone_number: phoneNumber,
        verification_code: verificationCode
      }
    }).then((res) => {
      this._userId = res.user_profile.user_id
      this._authToken = res.auth_token
      return res
    })
  }

  async getMe(): Promise<GetMeAPIResponse> {
    return this._fetch({
      endpoint: `/me`,
      method: 'POST',
      body: {
        return_blocked_ids: true,
        return_following_ids: true
        // timezone_identifier
      }
    })
  }

  async getProfile(userId: UserId): Promise<UserProfileAPIResponse> {
    return this._fetch({
      endpoint: `/get_profile`,
      method: 'POST',
      body: {
        user_id: userId
      }
    })
  }

  async getClub(clubId: ClubId): Promise<GetClubAPIResponse> {
    return this._fetch({
      endpoint: `/get_club`,
      method: 'POST',
      body: {
        club_id: clubId
      }
    })
  }

  async followClub(clubId: ClubId): Promise<ClubhouseAPIResponse> {
    return this._fetch({
      endpoint: `/follow_club`,
      method: 'POST',
      body: {
        club_id: clubId
      }
    })
  }

  async checkWaitlistStatus(): Promise<WaitlistStatusAPIResponse> {
    return this._fetch({
      endpoint: `/check_waitlist_status`
    })
  }

  async getAllTopics(): Promise<GetAllTopicsAPIResponse> {
    return this._fetch({
      endpoint: `/get_all_topics`,
      method: 'GET'
    })
  }

  async getTopic(topicId: TopicId): Promise<GetTopicAPIResponse> {
    return this._fetch({
      endpoint: `/get_topic`,
      method: 'POST',
      body: {
        topic_id: topicId
      }
    })
  }

  async getClubsForTopic(topicId: TopicId): Promise<PagedClubAPIResponse> {
    return this._fetch({
      endpoint: `/get_clubs_for_topic`,
      method: 'POST',
      body: {
        topic_id: topicId
      }
    })
  }

  async getUsersForTopic(topicId: TopicId): Promise<PagedUserAPIResponse> {
    return this._fetch({
      endpoint: `/get_users_for_topic`,
      method: 'POST',
      body: {
        topic_id: topicId
      }
    })
  }

  async getChannels(): Promise<GetChannelsAPIResponse> {
    return this._fetch({
      endpoint: `/get_channels`,
      method: 'POST',
      body: {}
    })
  }

  async joinChannel(channel): Promise<JoinChannelAPIResponse> {
    return this._fetch({
      endpoint: `/join_channel`,
      method: 'POST',
      body: {
        channel
      }
    })
  }

  async searchUsers(query: string): Promise<PagedUserAPIResponse> {
    return this._fetch({
      endpoint: `/search_users`,
      method: 'POST',
      body: {
        query,
        cofollows_only: false,
        followers_only: false,
        following_only: false
      }
    })
  }

  async searchClubs(query: string): Promise<PagedClubAPIResponse> {
    return this._fetch({
      endpoint: `/search_clubs`,
      method: 'POST',
      body: {
        query,
        cofollows_only: false,
        followers_only: false,
        following_only: false
      }
    })
  }

  async getFollowers(
    userId: UserId,
    {
      pageSize = MAX_PAGE_SIZE,
      page = 1
    }: {
      pageSize?: number
      page?: number
    } = {}
  ): Promise<PagedUserAPIResponse> {
    return this._fetch({
      endpoint: `/get_followers`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: pageSize,
        page
      }
    })
  }

  async getFollowing(
    userId: UserId,
    {
      pageSize = MAX_PAGE_SIZE,
      page = 1
    }: {
      pageSize?: number
      page?: number
    } = {}
  ): Promise<PagedUserAPIResponse> {
    return this._fetch({
      endpoint: `/get_following`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: pageSize,
        page
      }
    })
  }

  async getAllFollowing(
    userId,
    {
      pageSize = MAX_PAGE_SIZE,
      maxUsers = Number.POSITIVE_INFINITY
    }: {
      pageSize?: number
      maxUsers?: number
    } = {}
  ): Promise<User[]> {
    let users: User[] = []
    let page = 1

    do {
      const currentPage = await this.getFollowing(userId, {
        pageSize,
        page
      })

      users = users.concat(currentPage.users)
      page = currentPage.next

      if (users.length >= maxUsers) {
        break
      }
    } while (page)

    return users
  }

  async getAllFollowers(
    userId,
    {
      pageSize = MAX_PAGE_SIZE,
      maxUsers = Number.POSITIVE_INFINITY
    }: {
      pageSize?: number
      maxUsers?: number
    } = {}
  ): Promise<User[]> {
    let users: User[] = []
    let page = 1

    do {
      const currentPage = await this.getFollowers(userId, {
        pageSize,
        page
      })

      users = users.concat(currentPage.users)
      // console.log({
      //   users: currentPage.users.length,
      //   total: users.length,
      //   count: currentPage.count,
      //   previous: currentPage.previous,
      //   next: currentPage.next
      // })
      page = currentPage.next

      if (users.length >= maxUsers) {
        break
      }
    } while (page)

    return users
  }

  async __fetch({
    endpoint,
    method = 'GET',
    auth = true,
    body,
    gotOptions,
    headers,
    ...rest
  }: ClubhouseClientFetchParams) {
    const apiUrl = `${this._apiBaseUrl}${endpoint}`

    let authHeaders
    if (auth) {
      if (!this.isAuthenticated) {
        throw new Error(`Error ${endpoint} requires authentication`)
      }

      authHeaders = {
        authorization: `Token ${this._authToken}`,
        'ch-deviceid': this._deviceId,
        'ch-userid': this._userId
      }
    }

    const params: any = {
      method,
      ...gotOptions,
      headers: {
        ...this._headers,
        ...authHeaders,
        ...headers
      },
      ...rest
    }

    if (method === 'POST' || method === 'PUT') {
      params.json = body
    }

    if (this.log) {
      const { headers: temp, ...debugParams } = params
      this.log(apiUrl, JSON.stringify(debugParams, null, 2))
    }

    return got(apiUrl, params).json()
  }
}
