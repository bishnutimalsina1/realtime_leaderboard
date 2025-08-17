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

console.log("Attempting to connect to Kafka broker:", KAFKA_BROKER);

const kafka = new Kafka({
  clientId: "game-service",
  brokers: [KAFKA_BROKER],
  retry: {
    retries: 8,
    initialRetryTime: 1000,
    maxRetryTime: 30000,
    factor: 1.5,
  },
  connectionTimeout: 10000,
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
    publisherConfig: PublisherConfig
  }
  type PublisherConfig {
    batchSize: Int
    intervalSeconds: Int
  }
  type Mutation {
    updatePublisherConfig(batchSize: Int, intervalSeconds: Int): PublisherConfig
  }
`;

interface User {
  user_id: string;
  user_name: string;
  score: number;
}

interface PublisherConfig {
  batchSize: number;
  intervalSeconds: number;
}

// Publisher configuration state
let publisherConfig: PublisherConfig = {
  batchSize: 2,
  intervalSeconds: 20,
};

let currentInterval: NodeJS.Timeout | null = null;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    leaderboard: (): User[] => leaderboard,
    publisherConfig: (): PublisherConfig => publisherConfig,
  },
  Mutation: {
    updatePublisherConfig: async (
      _: any,
      { batchSize, intervalSeconds }: Partial<PublisherConfig>
    ): Promise<PublisherConfig> => {
      if (batchSize !== undefined) {
        publisherConfig.batchSize = Math.max(1, batchSize); // Ensure at least 1
      }
      if (intervalSeconds !== undefined) {
        publisherConfig.intervalSeconds = Math.max(1, intervalSeconds); // Ensure at least 1 second
      }

      // Restart the publisher with new config if it's running
      if (currentInterval) {
        clearInterval(currentInterval);
        startScorePublisher();
      }

      return publisherConfig;
    },
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
  try {
    await producer.connect();
    console.log("Successfully connected to Kafka.");
  } catch (err) {
    console.error("Failed to connect to Kafka:", err);
    throw err;
  }

  currentInterval = setInterval(async () => {
    try {
      const batch: User[] = generateRandomUsers(publisherConfig.batchSize);
      leaderboard.push(...batch); // Update in-memory leaderboard
      console.log(
        `Published Batch of ${publisherConfig.batchSize} users:`,
        batch
      );

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
