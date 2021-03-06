'use strict'

require('dotenv-safe').config()

const { ClubhouseClient } = require('clubhouse-client')
const { crawlSocialGraph } = require('clubhouse-crawler')

// incremental crawler for the clubhouse social graph
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
  const isFullUser = (user) =>
    user.following || user.invited_by_user_profile_id || user.url

  // remove this if you don't have any existing users
  // NOTE: this version of the crawler does not use neo4j. it just uses local JSON files
  let existingUsers = {}
  try {
    existingUsers = require('../data/users.json')
  } catch (err) {
    console.warn('error loading existing users; starting fresh crawl')
  }

  const existingUserIds = Object.keys(existingUsers)
  const existingUserFullIds = new Set(
    existingUserIds.filter((userId) => !!isFullUser(existingUsers[userId]))
  )
  const existingUserPendingIds = new Set(
    existingUserIds.filter((userId) => !isFullUser(existingUsers[userId]))
  )

  clubhouse.log('crawling', {
    existingUserFullIds: existingUserFullIds.size,
    existingUserPendingIds: existingUserPendingIds.size
  })

  const users = await crawlSocialGraph(clubhouse, seedUserId, {
    maxUsers: 100000,
    incrementalUserIds: existingUserFullIds,
    incrementalPendingUserIds: existingUserPendingIds
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch((err) => {
  console.error(err)
})
