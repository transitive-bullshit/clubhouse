import got from 'got'
import pThrottle from 'p-throttle'

const MAX_PAGE_SIZE = 400

export class ClubhouseClient {
  _apiBaseUrl = ''
  _headers = {}

  _deviceId = null
  _userId = null
  _token = null

  constructor(opts = {}) {
    const {
      deviceId,
      userId,
      token,
      apiBaseUrl,
      appBuild = '304',
      appVersion = '0.1.28',
      throttle = {
        limit: 1,
        interval: 2000
      }
    } = opts

    this._apiBaseUrl = apiBaseUrl || 'https://www.clubhouseapi.com/api'
    // 'https://api.hipster.house/api'

    this._deviceId = deviceId
    this._userId = userId
    this._token = token

    // throttle clubhouse API calls to mitigate rate limiting
    this._fetch = pThrottle(throttle)(this.__fetch)

    this._headers = {
      'ch-appbuild': appBuild,
      'ch-appversion': appVersion,
      'ch-languages': 'en-US',
      'ch-locale': 'en_US',
      'user-agent': `clubhouse/${appVersion} (iPhone; iOS 13.5.1; Scale/3.00)`,
      ...opts.headers
    }
  }

  startPhoneNumberAuth(phoneNumber) {
    return this._fetch({
      auth: false,
      endpoint: `/start_phone_number_auth`,
      method: 'POST',
      body: {
        phoneNumber
      }
    })
  }

  resendPhoneNumberAuth(phoneNumber) {
    return this._fetch({
      auth: false,
      endpoint: `/resend_phone_number_auth`,
      method: 'POST',
      body: {
        phoneNumber
      }
    })
  }

  completePhoneNumberAuth(phoneNumber, verificationCode) {
    return this._fetch({
      auth: false,
      endpoint: `/complete_phone_number_auth`,
      method: 'POST',
      body: {
        phoneNumber,
        verificationCode
      }
    })
  }

  getProfile(userId) {
    return this._fetch({
      endpoint: `/get_profile`,
      method: 'POST',
      body: {
        user_id: userId
      }
    })
  }

  getMe() {
    return this._fetch({
      endpoint: `/me`,
      method: 'POST',
      body: {}
    })
  }

  checkWaitlistStatus() {
    return this._fetch({
      endpoint: `/check_waitlist_status`
    })
  }

  getFollowers(userId, opts = {}) {
    const { pageSize = MAX_PAGE_SIZE, page = 1 } = opts

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

  getFollowing(userId, opts = {}) {
    const { pageSize = MAX_PAGE_SIZE, page = 1 } = opts

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

  async getAllFollowing(userId, opts = {}) {
    const {
      pageSize = MAX_PAGE_SIZE,
      maxUsers = Number.POSITIVE_INFINITY
    } = opts

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

  async getAllFollowers(userId, opts = {}) {
    const {
      pageSize = MAX_PAGE_SIZE,
      maxUsers = Number.POSITIVE_INFINITY
    } = opts

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

  get isAuthenticated() {
    return this._token && this._deviceId && this._userId
  }

  __fetch({
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
        authorization: `Token ${this._token}`,
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

    const { headers: temp, ...debugParams } = params
    console.error(apiUrl, JSON.stringify(debugParams, null, 2))

    return got(apiUrl, params).json()
  }
}
