import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { v4 as uuidv4 } from "uuid";
import { Kafka } from "kafkajs";

// Kafka setup
const kafka = new Kafka({
  clientId: "game-service",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const producer = kafka.producer();

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
const publishScores = async (): Promise<void> => {
  await producer.connect();
  setInterval(async () => {
    const batch: User[] = generateRandomUsers(2);
    leaderboard = [...leaderboard, ...batch]; // Update leaderboard
    const messages = batch.map((user) => ({
      key: user.user_id,
      value: JSON.stringify(user),
    }));

    const payloads = {
      topic: "leaderboard-scores",
      messages: messages,
    };
    await producer.send(payloads);

    // Test if message has been produced
    const consumer = kafka.consumer({ groupId: "test-group" });
    await consumer.connect();
    await consumer.subscribe({
      topic: "leaderboard-scores",
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log("consumer:", {
          value: message.value.toString(),
        });
      },
    });
  }, 20000); // Every 20 second
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Game server ready at: ${url}`);

publishScores();
