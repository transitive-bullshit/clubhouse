import PQueue from 'p-queue'

import { ClubhouseClient } from './clubhouse-client'
import { UserId, SocialGraph, SocialGraphUserProfile } from './types'

/**
 * Performs a BFS traversal over the Clubhouse social graph, starting from a
 * given seed user and expanding outwards from there.
 */
export async function crawlSocialGraph(
  clubhouse: ClubhouseClient,
  seedUserId: UserId,
  {
    concurrency = 4,
    maxUsers = Number.POSITIVE_INFINITY
  }: {
    concurrency?: number
    maxUsers?: number
  } = {}
): Promise<SocialGraph> {
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set<string>()
  const users: SocialGraph = {}
  let numUsers = 0

  function processUser(origUserId: UserId) {
    // ensure that all user IDs we work with are strings
    const userId = `${origUserId}`

    if (
      origUserId &&
      userId &&
      users[userId] === undefined &&
      !pendingUserIds.has(userId) &&
      numUsers < maxUsers
    ) {
      pendingUserIds.add(userId)
      numUsers++

      queue.add(async () => {
        try {
          const numUsersCrawled = Object.keys(users).length
          clubhouse.log(
            `crawling user ${userId} (${numUsersCrawled} users crawled)`
          )
          const userProfileRes = await clubhouse.getProfile(userId)
          if (!userProfileRes) {
            users[userId] = null
            return
          }

          const user = userProfileRes.user_profile as SocialGraphUserProfile
          if (!user) {
            users[userId] = null
            return
          }

          users[userId] = user
          clubhouse.log(
            `user ${userId} (${user.username}) found (${numUsersCrawled} users crawled)`
          )

          {
            // fetch all of the users following this user
            const following = await clubhouse.getAllFollowing(userId, {
              maxUsers
            })
            clubhouse.log(
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
            clubhouse.log(
              `user ${userId} (${user.username}) found ${followers.length} followers`
            )

            for (const followerUser of followers) {
              processUser(followerUser.user_id)
            }

            user.followers = followers
          }

          // print incremental progress to stdout
          console.log(JSON.stringify(user, null, 2))
        } catch (err) {
          clubhouse.log('error crawling user', userId, err)
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
