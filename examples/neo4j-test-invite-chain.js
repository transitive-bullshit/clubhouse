'use strict'

require('dotenv-safe').config()

const neo4j = require('neo4j-driver')
const db = require('clubhouse-crawler')

async function main() {
  const driver = db.driver()

  try {
    try {
      await driver.verifyConnectivity()
      console.error('driver connected')
    } catch (err) {
      console.error('driver connection error', err)
    }

    const session = driver.session({ defaultAccessMode: neo4j.READ })
    try {
      // const userId = 2481724 // travis
      // const userId = 3509501 // sadie
      // const userId = 1740700 // alex
      const userId = 1968234007 // dawson
      // const userId = 4 // founder

      const inviteChain = []
      let currentUserId = userId

      while (true) {
        const user = (
          await db.getUserWhoInvitedUserById(session, currentUserId)
        ).records[0]?.get(0)?.properties

        if (!user) {
          break
        }

        inviteChain.push(user)
        currentUserId = user.user_id
      }

      console.log(inviteChain)
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
