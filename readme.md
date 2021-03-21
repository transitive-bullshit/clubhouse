# Clubhouse Social Graph

> Crawler for the Clubhouse social graph using their unofficial API.

[![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Disclaimer

This code is intended purely for educational purposes. It may go against the Clubhouse ToS, so use at your own discretion. We recommend against using this API / crawler with your personal Clubhouse account — you may get banned.

Happy Hacking 🙃

## Usage

```ts
import { ClubhouseClient } from 'clubhouse-client'

const clubhouse = new ClubhouseClient()
const exampleUserId = '2481724'

const examplePhoneNumber = '+15555555555'
await clubhouse.startPhoneNumberAuth(examplePhoneNumber)

// get 2-factor SMS code
const exampleVerificationCode = '5555'

await clubhouse.completePhoneNumberAuth(
  examplePhoneNumber,
  exampleVerificationCode
)

// you should now be authenticated with a userId and authToken
// you can alternatively auth directly via params to the ClubhouseClient constructor

const me = await clubhouse.getMe()

const profile = await clubhouse.getProfile(exampleUserId)

// get a single page of results for users that our example user is following
const followers = await clubhouse.getFollowers(exampleUserId)

// get a single page of results for users following our example user
const following = await clubhouse.getFollowing(exampleUserId)

// get all of the users that our example user is following
// (this will fetch all of the page results)
const allFollowing = await clubhouse.getAllFollowing(exampleUserId)

// get all of the users following our example user
// (this will fetch all of the page results)
const allFollowers = await clubhouse.getAllFollowers(exampleUserId)
```

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

Support my OSS work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
