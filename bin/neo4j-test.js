'use strict'

require('dotenv-safe').config()

const neo4j = require('neo4j-driver')
const db = require('../build/neo4j')

async function main() {
  const driver = db.driver()

  try {
    try {
      await driver.verifyConnectivity()
      console.log('Driver created')
    } catch (error) {
      console.log(`connectivity verification failed. ${error}`)
    }

    const session = driver.session({ defaultAccessMode: neo4j.READ })
    try {
      const userId = 2481724
      // const userId = 4

      // const res = await session.readTransaction((tx) => db.getNumUsers(tx))
      // const res = await db.getNumUsers(session)
      // const res = await db.getUserById(session, userId)
      // const res = await db.getUserFollowersById(session, userId)
      // const res = await db.getFollowingUsersById(session, userId)
      // const res = await db.getNumFollowersById(session, userId)
      // const res = await db.getNumFollowingById(session, userId)
      // const res = await db.getNumFollowers(session)
      // const res = await db.getNumUserInvites(session)
      // const res = await db.getNumUsersInvitedById(session, userId)
      // const res = await db.getNumInvitesForUserById(session, userId)
      // const res = await db.getUsersInvitedById(session, userId)
      const res = await db.getUserById(session, userId)

      console.log(res)
      console.log(res.records[0]?.get(0))
    } catch (error) {
      console.log(`unable to execute query. ${error}`)
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
