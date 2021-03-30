'use strict'

require('dotenv-safe').config()

const crawler = require('clubhouse-crawler')

async function main() {
  const users = require('../out-temp.json')
  const driver = crawler.driver()

  try {
    try {
      await driver.verifyConnectivity()
      console.error('driver connected')
    } catch (err) {
      console.error('driver connection error', err)
    }

    for (let i = 0; i < users.length; ++i) {
      const session = driver.session()
      const user = users[i]
      console.log(`${i + 1} / ${users.length}) upserting user`, user)

      try {
        const res = await crawler.upsertSocialGraphUser(session, user)
        console.log('user', res.records[0]?.get(0))
      } catch (err) {
        console.error('upsert error', i, err)
        throw err
      } finally {
        await session.close()
      }
    }
  } finally {
    await driver.close()
  }
}

main().catch((err) => {
  console.error(err)
})
