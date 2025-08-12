# Leaderboard Service

This is the **leaderboard_service** microservice for the leaderboard project. It provides a GraphQL API for leaderboard operations and interacts with a PostgreSQL database to store and retrieve leaderboard data.

## Features

- GraphQL API endpoint for leaderboard queries and mutations
- Connects to a PostgreSQL database using environment variables
- Automatic retry logic for database connection
- Uses gqlgen for GraphQL server implementation in Go

## How It Works

- The service starts a GraphQL server (default port: 8080)
- On startup, it initializes a connection to the PostgreSQL database using credentials from environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
- If the database is not available, it retries the connection until successful
- The GraphQL resolvers interact with the database to serve leaderboard data

## API

- GraphQL endpoint: `/query`
- Playground: `/` (for interactive GraphQL queries)

## Environment Variables

- `DB_HOST`: Hostname of the PostgreSQL server (e.g., `postgres` in Docker Compose)
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `PORT`: Service port (default: 8080)

## Running Locally

1. Ensure PostgreSQL is running and accessible
2. Set the required environment variables
3. Build and run the service:
   ```sh
   go build -o server .
   ./server
   ```
4. Access the GraphQL playground at:
   [http://localhost:8080](http://localhost:8080)

## Docker Compose

This service is designed to run as part of a Docker Compose setup. See the root `docker-compose.yml` for service configuration and environment variables.

## Development

- Source code: [`server.go`](server.go)
- GraphQL schema and resolvers: [`graph/`](graph/)
- Database models: [`graph/model/`](graph/model/)

## License

MIT
