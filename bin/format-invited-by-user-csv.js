'use strict'

const fs = require('fs')
const { unparse } = require('papaparse')
const usersData = require('../data/users.json')

async function main() {
  const users = Object.values(usersData)
  const invites = []

  for (const user of users) {
    if (user.invited_by_user_profile_id) {
      invites.push({
        invited_by_user_profile_id: user.invited_by_user_profile_id,
        user_id: user.user_id
      })
    }
  }

  console.log(JSON.stringify(invites[0], null, 2))
  const output = unparse(invites)
  fs.writeFileSync('user-invites.csv', output)
}

main().catch((err) => {
  console.error(err)
})
