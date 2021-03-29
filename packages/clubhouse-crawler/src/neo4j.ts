import * as neo4j from 'neo4j-driver'

import { SocialGraphUserProfile } from 'clubhouse-client'
import { sanitize } from './utils'

export type TransactionOrSession = neo4j.Transaction | neo4j.Session

export const driver = (
  neo4jURI = process.env.NEO4J_URI,
  neo4jUser = process.env.NEO4J_USER,
  neo4jPassword = process.env.NEO4J_PASSWORD,
  neo4jEncryptedConnection = process.env.NEO4J_ENCRYPTED
) => {
  const isEncrypted =
    !!neo4jEncryptedConnection && neo4jEncryptedConnection !== 'false'

  return neo4j.driver(neo4jURI, neo4j.auth.basic(neo4jUser, neo4jPassword), {
    disableLosslessIntegers: true,
    encrypted: isEncrypted ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF'
  })
}

export const upsertUser = (
  tx: TransactionOrSession,
  user: SocialGraphUserProfile
) => {
  const isFullUser = (user: SocialGraphUserProfile): boolean =>
    !!(user.following || user.invited_by_user_profile_id || user.url)

  const setFields = `user.name = $name,
          user.photo_url = $photo_url,
          user.username = $username,
          user.twitter = $twitter,
          user.bio = $bio,
          user.displayname = $displayname,
          user.instagram = $instagram,
          user.num_followers = toInteger($num_followers),
          user.num_following = toInteger($num_following),
          user.time_created = datetime($time_created),
          user.is_blocked_by_network = $is_blocked_by_network`

  let onMatch = ''
  if (isFullUser(user)) {
    onMatch = `
        ON MATCH SET ${setFields}
    `
  }

  return tx.run(
    `
      MERGE (user:User { user_id: toInteger($user_id) })
        ON CREATE SET ${setFields}
        ${onMatch}
        RETURN user;
    `,
    {
      name: null,
      photo_url: null,
      twitter: null,
      displayname: null,
      instagram: null,
      num_followers: -1,
      num_following: -1,
      time_created: null,
      is_blocked_by_network: false,
      ...user,
      bio: sanitize(user.bio)
    }
  )
}

export const upsertFollowsRelationship = (
  tx: TransactionOrSession,
  relationship: {
    follower_id: number
    user_id: number
  }
) => {
  return tx.run(
    `
      MATCH (userA:User {user_id: toInteger($follower_id)})
      MATCH (userB:User {user_id: toInteger($user_id)})
      MERGE (userA)-[op:FOLLOWS]->(userB)
      RETURN op;
    `,
    relationship
  )
}

export const upsertInvitedByUserRelationship = (
  tx: TransactionOrSession,
  relationship: {
    invited_by_user_profile_id: number
    user_id: number
  }
) => {
  return tx.run(
    `
      MATCH (userA:User {user_id: toInteger($invited_by_user_profile_id)})
      MATCH (userB:User {user_id: toInteger($user_id)})
      MERGE (userB)-[op:INVITED_BY_USER]->(userA)
      RETURN op;
    `,
    relationship
  )
}

export const upsertMemberOfClubRelationship = (
  tx: TransactionOrSession,
  relationship: {
    user_id: number
    club_id: number
  }
) => {
  return tx.run(
    `
      MATCH (user:User {user_id: toInteger($user_id)})
      MATCH (club:Club {club_id: toInteger($club_id)})
      MERGE (user)-[op:MEMBER_OF]->(club)
      RETURN op;
    `,
    relationship
  )
}

export const upsertInterestedInTopicRelationship = (
  tx: TransactionOrSession,
  relationship: {
    user_id: number
    topic_id: number
  }
) => {
  return tx.run(
    `
      MATCH (user:User {user_id: toInteger($user_id)})
      MATCH (topic:Topic {club_id: toInteger($topic_id)})
      MERGE (user)-[op:INTERESTED_IN]->(topic)
      RETURN op;
    `,
    relationship
  )
}

export const upsertSocialGraphUser = async (
  tx: TransactionOrSession,
  user: SocialGraphUserProfile
) => {
  const res = await upsertUser(tx, user)

  if (user.invited_by_user_profile_id) {
    await upsertInvitedByUserRelationship(tx, {
      invited_by_user_profile_id: user.invited_by_user_profile_id,
      user_id: user.user_id
    })
    // console.log('invited_by_user', res.records[0]?.get(0))
  }

  if (user.followers) {
    for (const follower of user.followers) {
      await upsertFollowsRelationship(tx, {
        follower_id: follower,
        user_id: user.user_id
      })
      // console.log('follower', res.records[0]?.get(0))
    }
  }

  if (user.following) {
    for (const following of user.following) {
      await upsertFollowsRelationship(tx, {
        follower_id: user.user_id,
        user_id: following
      })
      // console.log('following', res.records[0]?.get(0))
    }
  }

  if (user.club_ids) {
    for (const clubId of user.club_ids) {
      await upsertMemberOfClubRelationship(tx, {
        user_id: user.user_id,
        club_id: clubId
      })
      // console.log('memberOfClub', res.records[0]?.get(0))
    }
  }

  return res
}

export const getUserById = (tx: TransactionOrSession, userId: string) => {
  return tx.run(
    `
      MATCH (u:User)
      WHERE u.user_id = toInteger($userId)
      RETURN u
      LIMIT 1
    `,
    { userId }
  )
}

export const getUserFollowersById = (
  tx: TransactionOrSession,
  userId: string,
  {
    limit = 1000,
    skip = 0
  }: {
    limit?: number
    skip?: number
  } = {}
) => {
  return tx.run(
    `
      MATCH (follower:User)-[op:FOLLOWS]->(u:User { user_id: toInteger($userId) })
      RETURN follower
      ORDER BY follower.user_id
      SKIP ${skip}
      LIMIT ${limit}
    `,
    { userId }
  )
}

export const getFollowingUsersById = (
  tx: TransactionOrSession,
  userId: string,
  {
    limit = 1000,
    skip = 0
  }: {
    limit?: number
    skip?: number
  } = {}
) => {
  return tx.run(
    `
      MATCH (u:User { user_id: toInteger($userId) })-[op:FOLLOWS]->(following:User)
      RETURN following
      ORDER BY following.user_id
      SKIP ${skip}
      LIMIT ${limit}
    `,
    { userId }
  )
}

export const getNumFollowersById = (
  tx: TransactionOrSession,
  userId: string
) => {
  return tx.run(
    `
      MATCH (follower:User)-[op:FOLLOWS]->(u:User { user_id: toInteger($userId) })
      RETURN count(op)
    `,
    { userId }
  )
}

export const getNumFollowingById = (
  tx: TransactionOrSession,
  userId: string
) => {
  return tx.run(
    `
      MATCH (follower:User { user_id: toInteger($userId) })-[op:FOLLOWS]->(user:User)
      RETURN count(op)
    `,
    { userId }
  )
}

export const getNumUsers = (tx: TransactionOrSession) => {
  return tx.run(
    `
      MATCH (u:User)
      RETURN count(*)
    `
  )
}

export const getNumFollowers = (tx: TransactionOrSession) => {
  return tx.run(
    `
      MATCH (f:User)-[op:FOLLOWS]->(u:User)
      RETURN count(op)
    `
  )
}

export const getNumUserInvites = (tx: TransactionOrSession) => {
  return tx.run(
    `
      MATCH (a:User)-[op:INVITED_BY_USER]->(b:User)
      RETURN count(op)
    `
  )
}

export const getNumUsersInvitedById = (
  tx: TransactionOrSession,
  userId: string
) => {
  return tx.run(
    `
      MATCH (user:User)-[op:INVITED_BY_USER]->(u:User { user_id: toInteger($userId) })
      RETURN count(op)
    `,
    { userId }
  )
}

// this should always be 0 or 1
export const getNumInvitesForUserById = (
  tx: TransactionOrSession,
  userId: string
) => {
  return tx.run(
    `
      MATCH (u:User { user_id: toInteger($userId) })-[op:INVITED_BY_USER]->(user:User)
      RETURN count(op)
    `,
    { userId }
  )
}

export const getUsersInvitedById = (
  tx: TransactionOrSession,
  userId: string,
  {
    limit = 1000,
    skip = 0
  }: {
    limit?: number
    skip?: number
  } = {}
) => {
  return tx.run(
    `
      MATCH (user:User)-[op:INVITED_BY_USER]->(u:User { user_id: toInteger($userId) })
      RETURN user
      ORDER BY user.user_id
      SKIP ${skip}
      LIMIT ${limit}
    `,
    { userId }
  )
}
