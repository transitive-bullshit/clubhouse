import PQueue from 'p-queue'

import { ClubhouseClient } from './clubhouse-client'
import {
  UserId,
  SocialGraph,
  User,
  UserProfile,
  SocialGraphUserProfile
} from './types'

/**
 * Performs a BFS traversal over the Clubhouse social graph, starting from a
 * given seed user and expanding outwards from there.
 *
 * Supports incremental traversal via previously visited user IDs.
 */
export async function crawlSocialGraph(
  clubhouse: ClubhouseClient,
  seedUserId: UserId,
  {
    incrementalUserIds = new Set<string>(),
    incrementalPendingUserIds = new Set<string>(),
    concurrency = 4,
    maxUsers = Number.POSITIVE_INFINITY,
    crawlFollowers = false,
    crawlInvites = true
  }: {
    incrementalUserIds?: Set<string>
    incrementalPendingUserIds?: Set<string>
    concurrency?: number
    maxUsers?: number
    crawlFollowers?: boolean
    crawlInvites?: boolean
  } = {}
): Promise<SocialGraph> {
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set<string>()
  const users: SocialGraph = {}
  let numUsers = 0

  function printUser(user: User | SocialGraphUserProfile) {
    delete user.last_active_minutes

    if (!user.bio) {
      delete user.bio
    }

    if (!user.twitter) {
      delete user.twitter
    }

    // print incremental progress to stdout
    console.log(JSON.stringify(user, null, 2))
  }

  function filterAndCrawlSocialUser({
    user,
    following,
    followers
  }: {
    user: UserProfile
    following: User[]
    followers: User[]
  }) {
    if (crawlFollowers) {
      for (const u of following) {
        if (processUser(u.user_id)) {
          printUser(u)
        }
      }

      for (const u of followers) {
        if (processUser(u.user_id)) {
          printUser(u)
        }
      }

      for (const u of user.mutual_follows || []) {
        if (processUser(u.user_id)) {
          printUser(u)
        }
      }
    }

    if (crawlInvites) {
      if (processUser(user.invited_by_user_profile?.user_id)) {
        printUser(user.invited_by_user_profile)
      }
    }

    const socialUser = user as SocialGraphUserProfile
    socialUser.following = crawlFollowers
      ? following.map((u) => u.user_id)
      : null
    socialUser.followers = crawlFollowers
      ? followers.map((u) => u.user_id)
      : null
    socialUser.club_ids = (user.clubs || []).map((c) => c.club_id)
    socialUser.invited_by_user_profile_id =
      user.invited_by_user_profile?.user_id

    delete socialUser.clubs
    delete socialUser.mutual_follows
    delete socialUser.invited_by_user_profile

    return socialUser
  }

  function processUser(origUserId: UserId) {
    // ensure that all user IDs we work with are strings
    const userId = `${origUserId}`

    if (
      origUserId &&
      userId &&
      users[userId] === undefined &&
      !pendingUserIds.has(userId) &&
      !incrementalUserIds.has(userId) &&
      numUsers < maxUsers
    ) {
      pendingUserIds.add(userId)
      numUsers++

      queue.add(async () => {
        try {
          const numUsersCrawled = Object.keys(users).length
          clubhouse.log(
            `crawling user ${userId}; ${numUsersCrawled} users crawled; ${pendingUserIds.size} users pending`
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

          clubhouse.log(
            `user ${userId} (${user.username}) found; ${numUsersCrawled} users crawled; ${pendingUserIds.size} users pending`
          )

          // TODO: temporary
          let following = []
          let followers = []

          if (crawlFollowers) {
            // fetch all of the users following this user
            following = await clubhouse.getAllFollowing(userId, {
              maxUsers
            })
            clubhouse.log(
              `user ${userId} (${user.username}) found ${following.length}/${user.num_following} following`
            )

            // fetch all of this user's followers
            followers = await clubhouse.getAllFollowers(userId, {
              maxUsers
            })
            clubhouse.log(
              `user ${userId} (${user.username}) found ${followers.length}/${user.num_followers} followers`
            )
          }

          const socialUser = filterAndCrawlSocialUser({
            user,
            following,
            followers
          })
          printUser(socialUser)

          users[userId] = socialUser
        } catch (err) {
          clubhouse.log('error crawling user', userId, err)
          if (users[userId] === undefined) {
            users[userId] = null
          }
        }

        pendingUserIds.delete(userId)
      })

      return true
    } else {
      return false
    }
  }

  processUser(seedUserId)
  for (const userId of incrementalPendingUserIds) {
    processUser(userId)
  }

  await queue.onIdle()

  return users
}
