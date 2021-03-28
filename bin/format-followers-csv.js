'use strict'

const fs = require('fs')
const { unparse } = require('papaparse')
const usersData = require('../data/users.json')

async function main() {
  const users = Object.values(usersData)
  const followers = []

  for (const user of users) {
    if (user.followers) {
      for (const follower of user.followers) {
        followers.push({
          user: user.user_id,
          follower
        })
      }
    }

    if (user.following) {
      for (const uid of user.following) {
        followers.push({
          user: uid,
          follower: user.user_id
        })
      }
    }
  }

  console.log(JSON.stringify(followers[0], null, 2))
  const output = unparse(followers)
  fs.writeFileSync('followers.csv', output)
}

main().catch((err) => {
  console.error(err)
})
