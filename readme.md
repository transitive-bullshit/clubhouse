# Clubhouse API

> Clubhouse API client and social graph crawler for TypeScript.

[![NPM](https://img.shields.io/npm/v/clubhouse-client.svg)](https://www.npmjs.com/package/clubhouse-client) [![Build Status](https://github.com/transitive-bullshit/clubhouse/actions/workflows/build.yml/badge.svg)](https://github.com/transitive-bullshit/clubhouse/actions/workflows/build.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Features

- 🤙 **TypeScript** - Simple, clean TS/JS wrapper for the Clubhouse API.
- 🚀 **Rate Limits** - Built-in throttling for Clubhouse rate limits.
- 💪 **Robust** - Built-in retry logic with exponential falloff via [got](https://github.com/sindresorhus/got).
- 🤖 **Crawler** - Comes with a built-in crawler for the Clubhouse social graph.
- 🕸 ️️**Persistent** - Crawler comes with optional [neo4j](https://neo4j.com/) support.

## Packages

| Package                                           | NPM                                                                                                           | Description                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [clubhouse-client](./packages/clubhouse-client)   | [![NPM](https://img.shields.io/npm/v/clubhouse-client.svg)](https://www.npmjs.com/package/clubhouse-client)   | Clubhouse API client                                                 |
| [clubhouse-crawler](./packages/clubhouse-crawler) | [![NPM](https://img.shields.io/npm/v/clubhouse-crawler.svg)](https://www.npmjs.com/package/clubhouse-crawler) | Clubhouse social graph crawler + [neo4j](https://neo4j.com/) support |

## Install

```sh
npm install --save clubhouse-client
# or
yarn add clubhouse-client
```

## Usage

```ts
import { ClubhouseClient } from 'clubhouse-client'

const exampleUserId = '2481724'
const examplePhoneNumber = '+15555555555'
const exampleVerificationCode = '5555'

const clubhouse = new ClubhouseClient()

await clubhouse.startPhoneNumberAuth(examplePhoneNumber)

// NOTE: manually get the SMS verification code

await clubhouse.completePhoneNumberAuth(
  examplePhoneNumber,
  exampleVerificationCode
)

// you should now be authenticated with a userId and authToken
// you can alternatively auth directly via the ClubhouseClient constructor

const me = await clubhouse.getMe()

const profile = await clubhouse.getProfile(exampleUserId)

// get a single page of users that our example user is following
const following = await clubhouse.getFollowing(exampleUserId)

// get a single page of users who are following our example user
const followers = await clubhouse.getFollowers(exampleUserId)

// get all of the users that our example user is following
// (this will attempt to fetch all of the page results)
const allFollowing = await clubhouse.getAllFollowing(exampleUserId)

// get all of the users following our example user
// (this will attempt to fetch all of the page results)
const allFollowers = await clubhouse.getAllFollowers(exampleUserId)
```

See [example.js](examples/example.js) for a basic Node.js example that uses a previously authenticated user.

See [crawler.js](examples/crawler.js) for a more advanced Node.js app that will crawl the Clubhouse social graph.

## Rate Limits

By default, the ClubhouseClient is set to make a maximum of one API call per 3.5 seconds, which empirically gets past most Clubhouse rate limits.

You'll definitely still run into some, and it's up to you how to best handle them. PLEASE DO NOT SPAM THE CLUBHOUSE API.

You can customize the default `ClubhouseClient` throttling via the `throttle` parameter which uses [p-throttle](https://github.com/sindresorhus/p-throttle) under the hood.

## Related

- [clubhouse-py](https://github.com/stypr/clubhouse-py) - Clubhouse API written in Python.
- [Houseclub](https://github.com/grishka/Houseclub) - A barebones unofficial Android app for Clubhouse.
- [hipster.house](https://github.com/zhuowei/hipster.house) - An intentionally terrible third-party Clubhouse client for web browsers.

## Disclaimer

This code is intended purely for educational purposes. It may go against the Clubhouse ToS, so use at your own discretion. We recommend against using this API / crawler with your personal Clubhouse account — you may get banned.

Happy Hacking 🙃

## License

MIT © [Travis Fischer](https://transitivebullsh.it) and [Tim Saval](https://twitter.com/timsaval)

Support my OSS work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
