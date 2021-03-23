'use strict'

const fs = require('fs')
const users = require('../data/users.json')

async function main() {
  const newUsers = require('../data/crawl-3-interrupted.json')
  const numUsersOld = Object.keys(users).length

  for (const user of newUsers) {
    if (!user) {
      continue
    }

    const id = user.user_id
    if (!users[id] || (!users[id].following && user.following)) {
      users[id] = user
      console.log(id)
    }
  }

  const numUsersNew = Object.keys(users).length
  console.log(numUsersOld, '=>', numUsersNew)

  const output = JSON.stringify(users, null, 1).replace(/^\s*/gm, '')
  fs.writeFileSync('out2.json', output)
}

main().catch((err) => {
  console.error(err)
})
