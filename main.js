import { ClubhouseClient } from './clubhouse-client'
import PQueue from 'p-queue'

async function main() {
  const token = 'a1bcd2983dd921fefc428f3bba55bbf79f3e7fc3'
  const deviceId = '3EE60C75-C867-4BEC-86D5-2B9ED33844D2'
  const userId = '2481724'

  const clubhouse = new ClubhouseClient({
    token,
    deviceId,
    userId
  })

  const seedUserId = '13870'

  // const profile = await clubhouse.getProfile(seedUserId)
  // console.log(JSON.stringify(profile, null, 2))

  const followers = await clubhouse.getFollowers(seedUserId)
  console.log(JSON.stringify(followers, null, 2))

  // const following = await clubhouse.getFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))
}

async function crawlSocialGraph(clubhouse, seedUserId, opts = {}) {
  const { concurrency = 4 } = opts
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set()
  const users = {}

  async function processUser(userId) {
    if (userId && users[userId] === undefined && !pendingUserIds.has(userId)) {
      pendingUserIds.add(userId)

      queue.add(async () => {
        try {
          const user = await clubhouse.getProfile(userId)
          if (!user) {
            return
          }

          users[userId] = user

          // const following =
        } catch (err) {
          console.warn('error crawling user', userId, err)
          if (!users[userId]) {
            users[userId] = null
          }
        }

        pendingUserIds.delete(userId)
      })
    }
  }

  await processUser(seedUserId)
  await queue.onIdle()

  return users
}

main().catch((err) => {
  console.error(err)
})
