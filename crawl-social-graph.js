import PQueue from 'p-queue'

/**
 * Performs a BFS traversal over the Clubhouse social graph, starting from a
 * given seed user and expanding outwards from there.
 */
export async function crawlSocialGraph(clubhouse, seedUserId, opts = {}) {
  const { concurrency = 4, maxUsers = Number.POSITIVE_INFINITY } = opts
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
          const numUsersCrawled = Object.keys(users).length
          clubhouse.log(
            `crawling user ${userId} (${numUsersCrawled} users crawled)`
          )
          const userProfile = await clubhouse.getProfile(userId)
          if (!userProfile) {
            return
          }

          const { user_profile: user } = userProfile
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

          users[userId] = user

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
