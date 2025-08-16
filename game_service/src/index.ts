import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { v4 as uuidv4 } from "uuid";
import { Kafka, Producer } from "kafkajs";

// Kafka setup
const KAFKA_BROKER = process.env.KAFKA_BROKERS;
if (!KAFKA_BROKER) {
  console.error("KAFKA_BROKERS environment variable is not set.");
  process.exit(1);
}

const kafka = new Kafka({
  clientId: "game-service",
  brokers: [KAFKA_BROKER],
  retry: {
    retries: 5,
    initialRetryTime: 300,
  },
});

const producer = kafka.producer();
const topic = "leaderboard-scores";

// Construct a schema, using GraphQL schema language
const typeDefs = `#graphql
  type User {
    user_id: String
    user_name: String
    score: Int
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

// Mock leaderboard - In a real app, this would be a database.
// This will grow indefinitely, which is a memory leak.
// For a mock service, this might be acceptable.
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

// Function to simulate publishing scores
const startScorePublisher = async (): Promise<() => Promise<void>> => {
  console.log(`Connecting to Kafka broker at ${KAFKA_BROKER}...`);
  await producer.connect();
  console.log("Successfully connected to Kafka.");

  const intervalId = setInterval(async () => {
    try {
      const batch: User[] = generateRandomUsers(2);
      leaderboard.push(...batch); // Update in-memory leaderboard
      console.log("Published Batch:", batch);

      const messages = batch.map((user) => ({
        key: user.user_id,
        value: JSON.stringify(user),
      }));

      await producer.send({
        topic: topic,
        messages: messages,
      });
    } catch (error) {
      console.error("Failed to send message to Kafka", error);
    }
  }, 20000); // Every 20 seconds

  // Return a function to stop the publisher
  return async () => {
    console.log("Stopping score publisher...");
    clearInterval(intervalId);
    await producer.disconnect();
    console.log("Kafka producer disconnected.");
  };
};

const main = async () => {
  let stopPublisher: () => Promise<void>;

  try {
    const server = new ApolloServer({ typeDefs, resolvers });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },
    });
    console.log(`🚀  Game server ready at: ${url}`);

    stopPublisher = await startScorePublisher();
  } catch (error) {
    console.error("Failed to start the service", error);
    process.exit(1);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (stopPublisher) {
      await stopPublisher();
    }
    process.exit(0);
  };

  // Listen for termination signals
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

main();
