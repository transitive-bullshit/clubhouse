'use strict'

require('dotenv-safe').config()

const db = require('../build/neo4j')

async function main() {
  const users = require('../out2.json')
  const driver = db.driver()

  try {
    try {
      await driver.verifyConnectivity()
      console.error('driver connected')
    } catch (err) {
      console.error('driver connection error', err)
    }

    const session = driver.session()
    try {
      for (let i = 0; i < users.length; ++i) {
        const user = users[i]
        console.log(`${i + 1} / ${users.length}) upserting user`, user)

        await session.writeTransaction(async (tx) => {
          const res = await db.upsertUser(tx, user)
          console.log('user', res.records[0]?.get(0))

          if (user.invited_by_user_profile_id) {
            const res = await db.upsertInvitedByUserRelationship(tx, {
              invited_by_user_profile_id: user.invited_by_user_profile_id,
              user_id: user.user_id
            })
            console.log('invited_by_user', res.records[0]?.get(0))
          }

          if (user.followers) {
            for (const follower of user.followers) {
              const res = await db.upsertFollowsRelationship(tx, {
                follower_id: follower,
                user_id: user.user_id
              })
              // console.log('follower', res.records[0]?.get(0))
            }
          }

          if (user.following) {
            for (const following of user.following) {
              const res = await db.upsertFollowsRelationship(tx, {
                follower_id: user.user_id,
                user_id: following
              })
              // console.log('following', res.records[0]?.get(0))
            }
          }

          if (user.club_ids) {
            for (const clubId of user.club_ids) {
              const res = await db.upsertMemberOfClubRelationship(tx, {
                user_id: user.user_id,
                club_id: clubId
              })
              // console.log('memberOfClub', res.records[0]?.get(0))
            }
          }
        })
      }
    } catch (err) {
      console.log(`unable to execute query. ${err}`)
    } finally {
      await session.close()
    }
  } finally {
    await driver.close()
  }
}

main().catch((err) => {
  console.error(err)
})
