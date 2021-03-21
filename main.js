import { ClubhouseClient } from './clubhouse-client'
import { crawlSocialGraph } from './crawl-social-graph'

async function main() {
  // TODO: remove these hard-coded constants
  const token = 'a1bcd2983dd921fefc428f3bba55bbf79f3e7fc3'
  const deviceId = '3EE60C75-C867-4BEC-86D5-2B9ED33844D2'
  const userId = '2481724'

  const clubhouse = new ClubhouseClient({
    token,
    deviceId,
    userId
  })

  const phoneNumber = '+19293048834'
  // const res = await clubhouse.startPhoneNumberAuth(phoneNumber)
  // console.dir(res)

  // const res2 = await clubhouse.resendPhoneNumberAuth(phoneNumber)
  // console.dir(res2)

  // const res3 = await clubhouse.completePhoneNumberAuth(phoneNumber, 3965)
  // console.dir(res3)

  // const seedUserId = '13870'
  const seedUserId = userId

  // const profile = await clubhouse.getProfile(seedUserId)
  // console.log(JSON.stringify(profile, null, 2))

  // const followers = await clubhouse.getFollowers(seedUserId)
  // console.log(JSON.stringify(followers, null, 2))

  // const following = await clubhouse.getFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  // const following = await clubhouse.getAllFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  // const users = await crawlSocialGraph(clubhouse, seedUserId, {
  //   maxUsers: 1000
  // })
  // console.log(JSON.stringify(users, null, 2))
}

main().catch((err) => {
  console.error(err)
})
