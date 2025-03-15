import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { v4 as uuidv4 } from 'uuid';

// Construct a schema, using GraphQL schema language
const typeDefs = `#graphql
  type User {
    user_id: String
    user_name: String
    score: String
  }
  type Query {
    leaderboard: [User]
  }
`;

interface User {
  user_id: string;
  user_name: string;
  score: number;
}

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    leaderboard: (): User[] => leaderboard,
  },
};

// Mock leaderboard
let leaderboard: User[] = [];

// Function to generate random user data
const generateRandomUsers = (batchSize: number): User[] => {
  const users: User[] = [];
  for (let i = 0; i < batchSize; i++) {
    const user: User = {
      user_id: uuidv4(),
      user_name: `User_${Math.floor(Math.random() * 10000)}`,
      score: Math.floor(Math.random() * 1000), // Random score between 0-999
    };
    users.push(user);
  }
  return users;
};

// Function to simulate publishing scores every second
const publishScores = (): void => {
  setInterval(() => {
    const batch: User[] = generateRandomUsers(5);
    leaderboard = [...leaderboard, ...batch]; // Update leaderboard
    console.log("Published Batch:", batch);
  }, 10000); // Every 10 second
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Game server ready at: ${url}`);

publishScores();