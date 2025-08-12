# Game Service

This is the **game_service** microservice for the leaderboard project. It provides a GraphQL API for generating and serving a mock leaderboard of users and their scores.

## Features

- GraphQL API endpoint for querying the leaderboard
- Random user and score generation every 10 seconds
- Uses Apollo Server and TypeScript

## API

### GraphQL Schema

```
type User {
  user_id: String
  user_name: String
  score: String
}
type Query {
  leaderboard: [User]
}
```

### Query Example

```
query {
  leaderboard {
    user_id
    user_name
    score
  }
}
```

## How It Works

- The service starts an Apollo GraphQL server (default port: 4000)
- Every 10 seconds, it generates 5 random users with scores and adds them to the leaderboard
- The leaderboard can be queried via the GraphQL API

## Running Locally

1. Install dependencies:
   ```sh
   yarn install
   ```
2. Start the service:
   ```sh
   yarn start
   ```
3. Access the GraphQL playground at:
   [http://localhost:4000](http://localhost:4000)
