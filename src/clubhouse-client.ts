import got from 'got'
import pThrottle from 'p-throttle'
import { v4 as uuidv4 } from 'uuid'

import { UserId } from './types'

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
  }
  log?: any
  headers?: any
}

export class ClubhouseClient {
  _apiBaseUrl: string = ''
  _headers: any = {}

  _deviceId: string = null
  _userId: UserId = null
  _authToken: string = null

  _fetch: any
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
        interval: 5000
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
    this._fetch = pThrottle(throttle)(this.__fetch)

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

  async getProfile(userId: UserId) {
    return this._fetch({
      endpoint: `/get_profile`,
      method: 'POST',
      body: {
        user_id: userId
      }
    })
  }

  async getMe() {
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

  async checkWaitlistStatus() {
    return this._fetch({
      endpoint: `/check_waitlist_status`
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
  ) {
    return this._fetch({
      endpoint: `/get_followers`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: Math.min(MAX_PAGE_SIZE, pageSize),
        page: page
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
  ) {
    return this._fetch({
      endpoint: `/get_following`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: Math.min(MAX_PAGE_SIZE, pageSize),
        page: page
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
  ) {
    let users = []
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
  ) {
    let users = []
    let page = 1

    do {
      const currentPage = await this.getFollowers(userId, {
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

  async __fetch({
    endpoint,
    method = 'GET',
    auth = true,
    body,
    gotOptions,
    headers,
    ...rest
  }) {
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

    const params = {
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
