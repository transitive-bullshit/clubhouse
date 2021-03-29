'use strict'

const fs = require('fs')
const { unparse } = require('papaparse')
const usersData = require('../data/users.json')
const { sanitize } = require('../build')

async function main() {
  const users = Object.values(usersData)
  for (const user of users) {
    delete user.following
    delete user.followers
    delete user.clubs
    delete user.invited_by_user_profile
    delete user.invited_by_user_profile_id
    delete user.invited_by_club
    delete user.mutual_follows_count
    delete user.mutual_follows
    delete user.notification_type
    delete user.follows_me
    delete user.url
    delete user.can_receive_direct_payment
    delete user.direct_payment_fee_rate
    delete user.direct_payment_fee_fixed
    user.bio = sanitize(user.bio)
  }

  console.log(JSON.stringify(users[0], null, 2))
  const output = unparse(users)
  fs.writeFileSync('users.csv', output)
}

main().catch((err) => {
  console.error(err)
})
