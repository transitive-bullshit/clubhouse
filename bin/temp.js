'use strict'

const fs = require('fs')
const raw = require('../out.json')

async function main() {
  const users = {}

  for (const user of raw) {
    if (!user) {
      continue
    }

    const id = user.user_id
    users[id] = user
  }

  let userIds = Object.keys(users)

  for (const userId of userIds) {
    const user = users[userId]

    if (user.following) {
      for (const u of user.following) {
        const uid = u.user_id
        if (!users[uid]) {
          users[uid] = u
        }
      }
    }

    if (user.followers) {
      for (const u of user.followers) {
        const uid = u.user_id
        if (!users[uid]) {
          users[uid] = u
        }
      }
    }

    if (user.mutual_follows) {
      for (const u of user.mutual_follows) {
        const uid = u.user_id
        if (!users[uid]) {
          users[uid] = u
        }
      }

      delete user.mutual_follows
    }

    if (user.invited_by_user_profile) {
      const u = user.invited_by_user_profile
      const uid = u.user_id
      if (!users[uid]) {
        users[uid] = u
      }

      user.invited_by_user_profile = uid
    }

    user.following = (user.following || []).map((u) => u.user_id)
    user.followers = (user.followers || []).map((u) => u.user_id)
    user.clubs = (user.clubs || []).map((c) => c.club_id)
    delete user.topics
  }

  userIds = Object.keys(users)
  for (const userId of userIds) {
    const user = users[userId]
    delete user.last_active_minutes

    if (!user.bio) {
      delete user.bio
    }

    if (!user.twitter) {
      delete user.twitter
    }
  }

  fs.writeFileSync('out2.json', JSON.stringify(users, null, 1))
}

main().catch((err) => {
  console.error(err)
})
