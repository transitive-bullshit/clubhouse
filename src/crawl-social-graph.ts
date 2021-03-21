import PQueue from 'p-queue'

import { ClubhouseClient } from './clubhouse-client'
import { UserId, ClubhouseSocialGraph } from './types'

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
): Promise<ClubhouseSocialGraph> {
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set<string>()
  const users = {}
  const followingMap = {}
  const followersMap = {}
  let numUsers = 0

  function processUser(origUserId: UserId) {
    // ensure that all user IDs we work with are strings
    const userId = `${origUserId}`

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
          const numUsersCrawled = Object.keys(users).length
          clubhouse.log(
            `crawling user ${userId} (${numUsersCrawled} users crawled)`
          )
          const userProfile = await clubhouse.getProfile(userId)
          if (!userProfile) {
            return
          }

          const { user_profile: user } = userProfile
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

            followingMap[userId] = following
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

            followersMap[userId] = followers
          }

          // print incremental progress to stdout
          console.log(JSON.stringify(user, null, 2))
        } catch (err) {
          clubhouse.log('error crawling user', userId, err)
          if (users[userId] === undefined) {
            users[userId] = null
          }

          if (followingMap[userId] === undefined) {
            followingMap[userId] = null
          }

          if (followersMap[userId] === undefined) {
            followersMap[userId] = null
          }
        }

        pendingUserIds.delete(userId)
      })
    }
  }

  processUser(seedUserId)
  await queue.onIdle()

  return {
    users,
    followers: followersMap,
    following: followingMap
  }
}
