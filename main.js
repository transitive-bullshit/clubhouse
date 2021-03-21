import { ClubhouseClient } from './clubhouse-client'
import PQueue from 'p-queue'

async function main() {
  // TODO: remove these hard-coded constants
  const token = 'a1bcd2983dd921fefc428f3bba55bbf79f3e7fc3'
  const deviceId = '3EE60C75-C867-4BEC-86D5-2B9ED33844D2'
  const userId = '2481724'

  const clubhouse = new ClubhouseClient({
    token,
    deviceId,
    userId
  })

  // const seedUserId = '13870'
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
    maxUsers: 1000
  })
  console.log(JSON.stringify(users, null, 2))
}

async function crawlSocialGraph(clubhouse, seedUserId, opts = {}) {
  const { concurrency = 1, maxUsers = Number.POSITIVE_INFINITY } = opts
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set()
  const users = {}
  let numUsers = 0

  function processUser(userId) {
    if (
      userId &&
      users[userId] === undefined &&
      !pendingUserIds.has(userId) &&
      numUsers < maxUsers
    ) {
      pendingUserIds.add(userId)
      numUsers++

      queue.add(async () => {
        try {
          console.error(
            `crawling user ${userId} (${Object.keys(users).length} users)`
          )
          const userProfile = await clubhouse.getProfile(userId)
          if (!userProfile) {
            return
          }

          const { user_profile: user } = userProfile
          console.error(
            `user ${userId} (${user.username}) found (${
              Object.keys(users).length
            } users)`
          )

          {
            // fetch all of the users following this user
            const following = await clubhouse.getAllFollowing(userId, {
              maxUsers
            })
            console.error(
              `user ${userId} (${user.username}) found ${following.length} following`
            )

            for (const followingUser of following) {
              processUser(followingUser.user_id)
            }

            user.following = following
          }

          {
            // fetch all of this user's followers
            const followers = await clubhouse.getAllFollowers(userId, {
              maxUsers
            })
            console.error(
              `user ${userId} (${user.username}) found ${followers.length} followers`
            )

            for (const followerUser of followers) {
              processUser(followerUser.user_id)
            }

            user.followers = followers
          }

          users[userId] = user
          console.log(JSON.stringify(user, null, 2))
        } catch (err) {
          console.warn('error crawling user', userId, err)
          if (users[userId] === undefined) {
            users[userId] = null
          }
        }

        pendingUserIds.delete(userId)
      })
    }
  }

  processUser(seedUserId)
  await queue.onIdle()

  return users
}

main().catch((err) => {
  console.error(err)
})
