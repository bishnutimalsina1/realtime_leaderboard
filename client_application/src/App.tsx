import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from "@apollo/client";
import "./App.css";

const client = new ApolloClient({
  uri: "http://localhost:8080/query",
  cache: new InMemoryCache(),
});

const LEADERBOARD_QUERY = gql`
  query {
    leaderboard {
      score
      user_id
      user_name
      rank
    }
  }
`;

function LeaderboardDashboard() {
  const { loading, error, data } = useQuery(LEADERBOARD_QUERY, {
    pollInterval: 2000, // Poll every 2 seconds
  });

  console.log("data", data)
  return (
    <div className="App">
      <h1>Leaderboard Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Failed to fetch leaderboard</p>}
      <table style={{ margin: "auto", borderCollapse: "collapse", minWidth: 400 }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>User Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {data?.leaderboard?.map((user: any) => (
            <tr key={user.user_id}>
              <td>{user.rank}</td>
              <td>{user.user_name}</td>
              <td>{user.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <LeaderboardDashboard />
    </ApolloProvider>
  );
}