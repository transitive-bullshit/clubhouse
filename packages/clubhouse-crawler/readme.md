# Clubhouse Crawler

> Clubhouse social graph crawler with Neo4j support.

[![NPM](https://img.shields.io/npm/v/clubhouse-crawler.svg)](https://www.npmjs.com/package/clubhouse-crawler) [![Build Status](https://github.com/transitive-bullshit/clubhouse/actions/workflows/build.yml/badge.svg)](https://github.com/transitive-bullshit/clubhouse/actions/workflows/build.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Features

- **TypeScript** - Simple, clean TS/JS wrapper for the Clubhouse API.
- **Rate Limits** - Built-in throttling for Clubhouse rate limits.
- **Robust** - Built-in retry logic with exponential falloff via [got](https://github.com/sindresorhus/got).
- **Crawler** - Comes with a built-in crawler for the Clubhouse social graph.
- ️️**Persistent** - Crawler comes with optional [neo4j](https://neo4j.com/) support.

## Install

```sh
npm install --save clubhouse-client clubhouse-crawler
# or
yarn add clubhouse-client clubhouse-crawler
```

## Usage

See [crawler.js](../../examples/crawler.js) for an example of a complete Node.js app that will crawl the Clubhouse social graph.

## Disclaimer

This code is intended purely for educational purposes. It may go against the Clubhouse ToS, so use at your own discretion. We recommend against using this API / crawler with your personal Clubhouse account — you may get banned.

Happy Hacking 🙃

## License

MIT © [Travis Fischer](https://transitivebullsh.it).

Support my OSS work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
