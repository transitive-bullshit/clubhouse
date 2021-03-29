# Neo4j Notes

## Labels

User
Club
Topic

## Relationships

User FOLLOWS User
User INVITED_BY_USER User
User INVITED_BY_CLUB Club
User MEMBER_OF Club
User INTERESTED_IN Topic

## Cypher Commands

```
CREATE CONSTRAINT unique_user_id ON (u:User) ASSERT u.user_id IS UNIQUE;
CREATE CONSTRAINT unique_username ON (u:User) ASSERT u.username IS UNIQUE;
CREATE CONSTRAINT unique_twitter ON (u:User) ASSERT u.twitter IS UNIQUE;
CREATE CONSTRAINT unique_club_id ON (c:Club) ASSERT c.club_id IS UNIQUE;
CREATE CONSTRAINT unique_topic_id ON (t:Topic) ASSERT t.id IS UNIQUE;
CALL db.awaitIndexes();

USING PERIODIC COMMIT 500
LOAD CSV WITH HEADERS FROM 'file:///users.csv' AS row
MERGE (user:User { user_id: toInteger(row.user_id) })
  ON CREATE SET user.name = row.name, user.photo_url = row.photo_url, user.username = row.username, user.twitter = row.twitter, user.bio = row.bio, user.displayname = row.displayname, user.instagram = row.instagram, user.num_followers = toInteger(row.num_followers), user.num_following = toInteger(row.num_following), user.time_created = datetime(row.time_created), user.is_blocked_by_network = row.is_blocked_by_network;

USING PERIODIC COMMIT 500
LOAD CSV WITH HEADERS FROM 'file:///followers.csv' AS row
MATCH (userA:User {user_id: toInteger(row.follower)})
MATCH (userB:User {user_id: toInteger(row.user)})
MERGE (userA)-[op:FOLLOWS]->(userB);

USING PERIODIC COMMIT 500
LOAD CSV WITH HEADERS FROM 'file:///user-invites.csv' AS row
MATCH (userA:User {user_id: toInteger(row.invited_by_user_profile_id)})
MATCH (userB:User {user_id: toInteger(row.user)})
MERGE (userB)-[op:INVITED_BY_USER]->(userA);

MATCH (u:User) RETURN count(u) as count;

MATCH (user:User)
WHERE NOT exists(user.time_scraped)
WITH user LIMIT 100000
SET user.time_scraped = datetime()
RETURN count(user);

MATCH ()-[r:INVITED_BY_USER]->() RETURN count(r) as count;
MATCH ()-[r:FOLLOWS]->() RETURN count(r) as count;
```

## CSV Issues

karan_m8657
17172
Irvski_Werski

elmarte
teddyonbass
yalkashalan
affl

/G\
\\\\\\\\\\\\\\\
