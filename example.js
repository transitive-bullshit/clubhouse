const { ClubhouseClient, crawlSocialGraph } = require('./build')

async function main() {
  // TODO: remove these hard-coded constants
  const authToken = '20bff16dc1015db14e0ffabad011813e758347ef'
  const deviceId = '3EE60C75-C867-4BEC-86D5-2B9ED33844D2'
  const userId = '2481724' // travis fischer

  const clubhouse = new ClubhouseClient({
    authToken,
    deviceId,
    userId
  })

  // const seedUserId = '13870' // gregarious
  const seedUserId = userId

  const profile = await clubhouse.getProfile(seedUserId)
  console.log(JSON.stringify(profile, null, 2))

  // const followers = await clubhouse.getFollowers(seedUserId)
  // console.log(JSON.stringify(followers, null, 2))

  // const following = await clubhouse.getFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  // const following = await clubhouse.getAllFollowing(seedUserId)
  // console.log(JSON.stringify(following, null, 2))

  // const socialGraph = await crawlSocialGraph(clubhouse, seedUserId, {
  //   maxUsers: 1000
  // })
  // console.log(JSON.stringify(socialGraph, null, 2))
}

main().catch((err) => {
  console.error(err)
})
