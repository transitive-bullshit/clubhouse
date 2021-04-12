'use strict'

require('dotenv-safe').config()

const db = require('clubhouse-crawler')
const neo4j = require('neo4j-driver')
const pMap = require('p-map')

async function main() {
  const users = require('../data/kaggle-batch.json')
  const driver = db.driver()

  try {
    try {
      await driver.verifyConnectivity()
      console.error('driver connected')
    } catch (err) {
      console.error('driver connection error', err)
    }

    console.log(`importing ${users.length} users`)
    const timeScraped = new Date().toISOString()

    await pMap(
      users,
      async (user, i) => {
        const userId = user.user_id
        const session = driver.session()
        console.error(`${i + 1} / ${users.length} upserting user`, userId)

        const setFields = `
            user.name = $name,
            user.photo_url = $photo_url,
            user.username = $username,
            user.twitter = $twitter,
            user.instagram = $instagram,
            user.num_followers = toInteger($num_followers),
            user.num_following = toInteger($num_following),
            user.time_created = datetime($time_created),
            user.time_scraped = datetime($time_scraped)`

        try {
          const oldUser = (
            await db.getUserById(session, userId)
          ).records[0]?.get(0)?.properties

          const newUser = (
            await session.run(
              `
            MERGE (user:User { user_id: toInteger($user_id) })
              ON CREATE SET ${setFields}
              ON MATCH SET ${setFields}
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
                is_blocked_by_network: false,
                time_created: null,
                time_scraped: timeScraped,
                ...user,
                num_followers: Math.max(
                  oldUser?.num_followers || -1,
                  user.num_followers || -1
                ),
                num_following: Math.max(
                  oldUser?.num_following || -1,
                  user.num_following || -1
                )
              }
            )
          ).records[0]?.get(0)?.properties

          if (oldUser) {
            delete oldUser.time_created
            delete oldUser.time_scraped
            delete oldUser.bio
          }

          if (newUser) {
            delete newUser.time_created
            delete newUser.time_scraped
            delete newUser.bio
          }

          console.log(oldUser, newUser)

          if (user.invited_by_user_profile) {
            const res = await db.upsertInvitedByUserRelationship(session, {
              invited_by_user_profile_id: user.invited_by_user_profile,
              user_id: userId
            })
            console.log('invitedBy', {
              invited_by_user_profile_id: user.invited_by_user_profile,
              user_id: userId
            })
          }
        } catch (err) {
          console.error('error', i, user, err)
        } finally {
          await session.close()
        }
      },
      {
        concurrency: 64
      }
    )
  } finally {
    await driver.close()
  }
}

main().catch((err) => {
  console.error(err)
})
