'use strict'

require('dotenv-safe').config()

const { ClubhouseClient } = require('clubhouse-client')

// basic example of how to use the ClubhouseClient for a previously authenticated user
async function main() {
  const authToken = process.env.CLUBHOUSE_AUTH_TOKEN
  const deviceId = process.env.CLUBHOUSE_DEVICE_ID
  const userId = process.env.CLUBHOUSE_USER_ID

  const clubhouse = new ClubhouseClient({
    authToken,
    deviceId,
    userId
  })

  const seedUserId = '4'

  const profile = await clubhouse.getProfile(seedUserId)
  console.log(JSON.stringify(profile, null, 2))

  const followers = await clubhouse.getFollowers(seedUserId)
  console.log(JSON.stringify(followers, null, 2))

  const following = await clubhouse.getFollowing(seedUserId)
  console.log(JSON.stringify(following, null, 2))

  // const allFollowing = await clubhouse.getAllFollowing(seedUserId)
  // console.log(JSON.stringify(allFollowing, null, 2))

  // const allFollowers = await clubhouse.getAllFollowers(seedUserId)
  // console.log(JSON.stringify(allFollowers, null, 2))
}

main().catch((err) => {
  console.error(err)
})
