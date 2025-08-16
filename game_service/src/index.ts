import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { v4 as uuidv4 } from 'uuid';
import { Kafka } from 'kafkajs';

// Kafka setup
const kafka = new Kafka({
  clientId: 'game-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
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

const connectWithRetry = async (producer: any, retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await producer.connect();
      console.log('Successfully connected to Kafka');
      return;
    } catch (err) {
      console.error('Failed to connect to Kafka', err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw new Error('Could not connect to Kafka after multiple retries');
      }
    }
  }
};

// Function to simulate publishing scores every second
const publishScores = async (): Promise<void> => {
  await connectWithRetry(producer);
  setInterval(async () => {
    const batch: User[] = generateRandomUsers(2);
    leaderboard = [...leaderboard, ...batch]; // Update leaderboard
    console.log("Published Batch:", batch);

    const messages = batch.map(user => ({
      key: user.user_id,
      value: JSON.stringify(user)
    }));

    await producer.send({
      topic: 'leaderboard-scores',
      messages: messages,
    });

  }, 20000); // Every 20 second
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Game server ready at: ${url}`);

publishScores();
