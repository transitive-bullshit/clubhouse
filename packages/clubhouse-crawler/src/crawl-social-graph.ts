import PQueue from 'p-queue'
import * as neo4j from 'neo4j-driver'

import {
  ClubhouseClient,
  UserId,
  SocialGraph,
  User,
  UserProfile,
  SocialGraphUserProfile
} from 'clubhouse-client'

import { UserNode } from './types'
import * as db from './neo4j'

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
    crawlInvites = true,
    driver
  }: {
    incrementalUserIds?: Set<string>
    incrementalPendingUserIds?: Set<string>
    concurrency?: number
    maxUsers?: number
    crawlFollowers?: boolean
    crawlInvites?: boolean
    driver?: neo4j.Driver
  } = {}
): Promise<SocialGraph> {
  const queue = new PQueue({ concurrency })
  const pendingUserIds = new Set<string>()
  const users: SocialGraph = {}
  let numUsers = 0

  async function upsertUser(user: User | SocialGraphUserProfile) {
    delete user.last_active_minutes

    if (!user.bio) {
      delete user.bio
    }

    if (!user.twitter) {
      delete user.twitter
    }

    if (driver) {
      const session = driver.session({ defaultAccessMode: 'WRITE' })

      try {
        await db.upsertSocialGraphUser(session, user as SocialGraphUserProfile)
      } finally {
        await session.close()
      }
    } else {
      // print incremental progress to stdout
      console.log(JSON.stringify(user, null, 2))
    }

    return null
  }

  async function filterAndCrawlSocialUser({
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
        if (await processUser(u.user_id)) {
          await upsertUser(u)
        }
      }

      for (const u of followers) {
        if (await processUser(u.user_id)) {
          await upsertUser(u)
        }
      }

      for (const u of user.mutual_follows || []) {
        if (await processUser(u.user_id)) {
          await upsertUser(u)
        }
      }
    }

    if (crawlInvites) {
      if (await processUser(user.invited_by_user_profile?.user_id)) {
        await upsertUser(user.invited_by_user_profile)
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

    // TODO: upsert clubs
    // TODO: upsert topics

    delete socialUser.clubs
    delete socialUser.mutual_follows
    delete socialUser.invited_by_user_profile

    return socialUser
  }

  async function isUserVisited(origUserId: UserId): Promise<boolean> {
    // ensure that all user IDs we work with are strings
    const userId = `${origUserId}`

    if (
      users[userId] !== undefined ||
      pendingUserIds.has(userId) ||
      incrementalUserIds.has(userId)
    ) {
      return true
    }

    if (driver) {
      const session = driver.session({ defaultAccessMode: 'READ' })
      let user: UserNode

      try {
        const res = await session.readTransaction((tx) =>
          db.getUserById(tx, origUserId)
        )
        user = res.records[0]?.get(0)
      } catch (err) {
        // TODO
        return false
      } finally {
        await session.close()
      }

      if (user) {
        if (user.properties.time_created) {
          // we've crawled the full user profile at least once
          return true
        }

        // TODO: incorporate timestamps into incremental scraping
        // const ts = user.properties.time_scraped?.toString()
      }
    }

    return false
  }

  async function processUser(
    origUserId: UserId,
    { force = false }: { force?: boolean } = {}
  ) {
    // ensure that all user IDs we work with are strings
    const userId = `${origUserId}`

    // users[userId] === undefined &&
    // !pendingUserIds.has(userId) &&
    // !incrementalUserIds.has(userId) &&

    if (
      origUserId &&
      userId &&
      numUsers < maxUsers &&
      (force || !(await isUserVisited(origUserId)))
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

          const socialUser = await filterAndCrawlSocialUser({
            user,
            following,
            followers
          })
          await upsertUser(socialUser)

          users[userId] = socialUser
          console.log(JSON.stringify(socialUser, null, 2))
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

  await processUser(seedUserId, { force: true })
  for (const userId of incrementalPendingUserIds) {
    await processUser(userId)
  }

  /** Run Algorithms */
  if (driver) {
    const session = driver.session({ defaultAccessMode: 'WRITE' })
    try {
      await session.writeTransaction(async (tx) => {
        /** Create inMemory graph if it doesn't exist */
        try {
          await db.createUserFollowersGraph(tx)
        } catch (errCreatingInMemoryGraph) {
          if (errCreatingInMemoryGraph.message.includes('already exists')) {
            // No worries, in memory graph already exists
          } else {
            throw errCreatingInMemoryGraph
          }
        }
        /** Run PageRank */
        await db.runPageRankWrite(tx, {})
        /** Run Community Detection - Label propagation */
        await db.runCommunityDetectionLabelPropagationWrite(tx, {})
      })
    } catch (err) {
      console.error('crawlSocialGraph: Error running PageRank', err)
    } finally {
      await session.close()
    }
  } else {
    console.warn('crawlSocialGraph: Did not run Graph Algorithms')
  }

  await queue.onIdle()
  return users
}
