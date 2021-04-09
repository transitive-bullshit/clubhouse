'use strict'

require('dotenv-safe').config()

const pMap = require('p-map')
const neo4j = require('neo4j-driver')
const db = require('clubhouse-crawler')

async function main() {
  // fill these in...
  const srcDriver = db.driver({
    neo4jURI: '',
    neo4jPassword: '',
    neo4jUser: ''
  })
  const dstDriver = db.driver({
    neo4jURI: '',
    neo4jPassword: '',
    neo4jUser: ''
  })

  try {
    try {
      await srcDriver.verifyConnectivity()
      console.error('src driver connected')

      await dstDriver.verifyConnectivity()
      console.error('dst driver connected')
    } catch (err) {
      console.error('driver connection error', err)
      throw err
    }

    const srcSession = srcDriver.session({ defaultAccessMode: neo4j.READ })
    const dstSession = dstDriver.session({ defaultAccessMode: neo4j.WRITE })
    try {
      const limit = 4096
      let skip = 0

      // import all user nodes
      // while (true) {
      //   console.log('users', skip)
      //   const res = await srcSession.run(`
      //     MATCH (user:User)
      //     RETURN user
      //     SKIP ${skip}
      //     LIMIT ${limit}
      //   `)
      //   const results = res.records.map((r) => r.get(0).properties)
      //   console.log(results.length)
      //   if (!results.length) {
      //     break
      //   }

      //   try {
      //     await dstSession.writeTransaction(async (tx) => {
      //       await pMap(results, (result) => db.upsertUser(tx, result), {
      //         concurrency: 256
      //       })
      //     })
      //   } catch (err) {
      //     console.warn('ERROR', skip, err)
      //   }

      //   skip += limit
      // }

      // import all "follows" relationships
      // while (true) {
      //   const res = await srcSession.run(`
      //     MATCH (a:User)-[op:FOLLOWS]->(b:User) RETURN a.user_id,b.user_id
      //     SKIP ${skip}
      //     LIMIT ${limit}
      //   `)
      //   const results = res.records.map((r) => ({
      //     follower_id: r.get(0),
      //     user_id: r.get(1)
      //   }))
      //   if (!results.length) {
      //     break
      //   }

      //   try {
      //     await dstSession.writeTransaction(async (tx) => {
      //       await pMap(
      //         results,
      //         (result) => db.upsertFollowsRelationship(tx, result),
      //         {
      //           concurrency: 256
      //         }
      //       )
      //     })
      //   } catch (err) {
      //     console.warn('ERROR', skip, err)
      //   }

      //   const count = (
      //     await dstSession.run(
      //       `MATCH ()-[r:FOLLOWS]->() RETURN count(r) as count`
      //     )
      //   ).records[0]?.get(0)

      //   skip += limit
      //   console.log(skip, 'vs', count)
      // }

      // import all "invited by" relationships
      while (true) {
        const res = await srcSession.run(`
          MATCH (a:User)-[op:INVITED_BY_USER]->(b:User) RETURN a.user_id,b.user_id
          SKIP ${skip}
          LIMIT ${limit}
        `)
        const results = res.records.map((r) => ({
          invited_by_user_profile_id: r.get(1),
          user_id: r.get(0)
        }))
        if (!results.length) {
          break
        }

        try {
          await dstSession.writeTransaction(async (tx) => {
            await pMap(
              results,
              (result) => db.upsertInvitedByUserRelationship(tx, result),
              {
                concurrency: 256
              }
            )
          })
        } catch (err) {
          console.warn('ERROR', skip, err)
        }

        const count = (
          await dstSession.run(
            `MATCH ()-[r:INVITED_BY_USER]->() RETURN count(r) as count`
          )
        ).records[0]?.get(0)

        skip += limit
        console.log(skip, 'vs', count)
      }
    } catch (err) {
      console.log('error', err)
      throw err
    } finally {
      await srcSession.close()
      await dstSession.close()
    }
  } finally {
    await srcDriver.close()
    await dstDriver.close()
  }
}

main().catch((err) => {
  console.error(err)
})
