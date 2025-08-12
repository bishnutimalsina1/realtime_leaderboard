## Run codegen

go run github.com/99designs/gqlgen generate

## Create table
psql -U postgres

```sql
CREATE TABLE leaderboard (
  user_id SERIAL PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL
);
```

## Create docker build without cache

docker-compose build --no-cache

## Run docker-compose
docker-compose up -d

## Run a specific container
docker ps
docker exec -it 8b34ff8edc4e bash

##

Run mutation and queries

```js
mutation createDummyUser($user_name: String!, $score: Int!) {
  createUser(user_name: $user_name, score: $score) {
    user_id
    user_name
    rank
    score
  }
}

{
  "user_name": "Dummy User",
  "score": 0
}

query {
	leaderboard {
    score
    user_id
    user_name
  }
}
```

## Game service
http://localhost:4000/
```js
query GetLeaderboard {
  leaderboard {
    score
    user_id
    user_name
  }
}
```