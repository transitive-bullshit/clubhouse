'use strict'

require('dotenv-safe').config()

const { ClubhouseClient } = require('clubhouse-client')
const crawler = require('clubhouse-crawler')

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

  const seedUserId = '4602198' // elon musk
  // const seedUserId = '76' // li jin
  // const seedUserId = '2481724' // travis
  // const seedUserId = '1968234007' // dawson
  // const seedUserId = '4' // clubhouse co-founder

  const driver = crawler.driver()
  const existingUserPendingIds = new Set()

  try {
    let session

    try {
      session = driver.session({ defaultAccessMode: 'READ' })

      const numUserNodes = (await crawler.getNumUsers(session)).records[0]?.get(
        0
      )
      const numFollowerRelationships = (
        await crawler.getNumFollowers(session)
      ).records[0]?.get(0)

      const numInviteRelationships = (
        await crawler.getNumUserInvites(session)
      ).records[0]?.get(0)

      const seedUserIds = (
        await crawler.getSeedUsers(session)
      ).records.map((record) => record.get(0))

      for (const userId of seedUserIds) {
        existingUserPendingIds.add(userId)
      }

      clubhouse.log('crawling', {
        numUserNodes,
        numFollowerRelationships,
        numInviteRelationships,
        seedUserIds
      })
    } finally {
      await session.close()
    }

    const socialGraph = await crawler.crawlSocialGraph(clubhouse, seedUserId, {
      maxUsers: 100000,
      crawlFollowers: true,
      crawlInvites: true,
      existingUserPendingIds,
      driver
    })
  } finally {
    await driver.close()
  }
}

main().catch((err) => {
  console.error(err)
})
