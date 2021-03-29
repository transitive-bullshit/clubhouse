'use strict'

require('dotenv-safe').config()

const db = require('clubhouse-crawler')

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
          const res = await db.upsertSocialGraphUser(tx, user)
          console.log('user', res.records[0]?.get(0))
          return res
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
