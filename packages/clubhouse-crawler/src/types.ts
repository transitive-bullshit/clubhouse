import * as neo4j from 'neo4j-driver'

export interface UserNode extends neo4j.Node {
  properties: {
    user_id: number
    name: string
    photo_url: string
    username: string
    twitter: string
    bio: string
    displayname: string
    instagram: string
    num_followers: number
    num_following: number
    time_created: neo4j.DateTime
    time_scraped: neo4j.DateTime
    is_blocked_by_network: string
  }
}
