'use strict'

require('dotenv-safe').config()

const prompts = require('prompts')
const delay = require('delay')
const { ClubhouseClient } = require('clubhouse-client')

const { sanitizePhoneNumber } = require('./sanitize-phone-number')

// log in with the clubhouse api
async function main() {
  const clubhouse = new ClubhouseClient()

  console.error('Log in to Clubhouse')
  const { rawPhoneNumber } = await prompts({
    type: 'text',
    name: 'rawPhoneNumber',
    message: 'Enter your phone number:'
  })
  const phoneNumber = sanitizePhoneNumber(rawPhoneNumber)
  if (!rawPhoneNumber) {
    throw new Error('error: invalid phone number', rawPhoneNumber)
  }

  console.error('sending sms code...')
  await clubhouse.startPhoneNumberAuth(phoneNumber)
  await delay(2000)

  const { verificationCode } = await prompts({
    type: 'text',
    name: 'verificationCode',
    message: 'Enter your SMS code from Clubhouse:'
  })

  const result = await clubhouse.completePhoneNumberAuth(
    phoneNumber,
    verificationCode
  )
  if (!result?.user_profile?.user_id) {
    console.error('error logging in', result)
    throw new Error(result.message)
  }

  console.log(`CLUBHOUSE_AUTH_TOKEN='${result.auth_token}'`)
  console.log(`CLUBHOUSE_DEVICE_ID='${clubhouse._deviceId}'`)
  console.log(`CLUBHOUSE_USER_ID='${result.user_profile.user_id}'`)
}

main().catch((err) => {
  console.error(err)
})
