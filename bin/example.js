'use strict'

require('dotenv-safe').config()
const { ClubhouseClient, crawlSocialGraph } = require('../build')

async function main() {
  // TODO: remove these hard-coded constants
  const authToken = process.env.CLUBHOUSE_AUTH_TOKEN
  const deviceId = process.env.CLUBHOUSE_DEVICE_ID
  const userId = process.env.CLUBHOUSE_USER_ID

  const clubhouse = new ClubhouseClient({
    authToken,
    deviceId,
    userId
  })

  // const seedUserId = '13870' // gregarious
  const seedUserId = userId

  // const profile = await clubhouse.getProfile(seedUserId)
  // console.log(JSON.stringify(profile, null, 2))

  // const followers = await clubhouse.getFollowers(seedUserId)
  // console.log(JSON.stringify(followers, null, 2))

  // const following = await clubhouse.getFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  // const following = await clubhouse.getAllFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  const users = await crawlSocialGraph(clubhouse, seedUserId, {
    maxUsers: 10000
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch((err) => {
  console.error(err)
})
