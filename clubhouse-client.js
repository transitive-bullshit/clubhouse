import got from 'got'

export class ClubhouseClient {
  _apiBaseUrl = ''
  _headers = {}

  _deviceId = null
  _userId = null
  _token = null

  constructor(opts) {
    if (!opts) throw new Error('Missing required ClubhouseClient opts')

    const { deviceId, userId, token } = opts
    if (!deviceId)
      throw new Error('Missing required ClubhouseClient opts.deviceId')
    if (!userId) throw new Error('Missing required ClubhouseClient opts.userId')
    if (!token) throw new Error('Missing required ClubhouseClient opts.token')

    this._apiBaseUrl = opts.apiBaseUrl || 'https://api.hipster.house/api'

    // TODO: figure out why accessing the clubhouse API directly fails with 403 errors
    // 'https://www.clubhouseapi.com/api'

    this._deviceId = deviceId
    this._userId = userId
    this._token = token

    this._headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'ch-appbuild': '269',
      'ch-appversion': '0.1.15',
      'ch-languages': 'en-US',
      'ch-locale': 'en_US',
      'sec-ch-ua':
        '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      ...opts.headers
    }
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
    const { pageSize = 400, page = 1 } = opts

    return this._fetch({
      endpoint: `/get_followers`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: pageSize,
        page: page
      }
    })
  }

  getFollowing(userId, opts = {}) {
    const { pageSize = 400, page = 1 } = opts

    return this._fetch({
      endpoint: `/get_following`,
      method: 'GET',
      searchParams: {
        user_id: userId,
        page_size: pageSize,
        page: page
      }
    })
  }

  _fetch({ endpoint, method = 'GET', body, gotOptions, headers, ...rest }) {
    const apiUrl = `${this._apiBaseUrl}${endpoint}`

    const params = {
      method,
      ...gotOptions,
      headers: {
        ...this._headers,
        authorization: `Token ${this._token}`,
        'ch-deviceid': this._deviceId,
        'ch-userid': this._userId,
        ...headers
      },
      ...rest
    }

    if (method === 'POST' || method === 'PUT') {
      params.json = body
    }

    return got(apiUrl, params).json()
  }
}
