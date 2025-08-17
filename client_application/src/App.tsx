import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  useMutation,
  gql,
} from "@apollo/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Box,
  Grid,
  Slider,
  TextField,
  IconButton,
  Button,
} from "@mui/material";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect } from "react";

let theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#03a9f4",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#d8d8d8ff",
      paper: "#0066b9",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "0.1rem",
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          backdropFilter: "blur(4px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "transform 0.3s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const client = new ApolloClient({
  uri: "http://localhost:8080/query",
  cache: new InMemoryCache(),
});

const LEADERBOARD_QUERY = gql`
  query GetLeaderboards($limit: Int!) {
    redis: leaderboard(limit: $limit) {
      data {
        rank
        user_id
        user_name
        score
      }
      metrics {
        queryTime
        recordCount
        dataSource
      }
    }
    sql: leaderboardSQL(limit: $limit) {
      data {
        rank
        user_id
        user_name
        score
      }
      metrics {
        queryTime
        recordCount
        dataSource
      }
    }
  }
`;

const PUBLISHER_CONFIG_QUERY = gql`
  query GetPublisherConfig {
    publisherConfig {
      batchSize
      intervalSeconds
    }
  }
`;

const UPDATE_PUBLISHER_CONFIG = gql`
  mutation UpdatePublisherConfig($batchSize: Int, $intervalSeconds: Int) {
    updatePublisherConfig(
      batchSize: $batchSize
      intervalSeconds: $intervalSeconds
    ) {
      batchSize
      intervalSeconds
    }
  }
`;

interface PerformanceData {
  timestamp: number;
  redisTime: number;
  sqlTime: number;
  dataSize: number;
}

function PerformanceMetrics({
  performanceData,
}: {
  performanceData: PerformanceData[];
}) {
  const latencyChartData = {
    labels: performanceData.map(() => ""),
    datasets: [
      {
        label: "Redis Query Time (ms)",
        data: performanceData.map((d) => d.redisTime),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
      {
        label: "SQL Query Time (ms)",
        data: performanceData.map((d) => d.sqlTime),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
    ],
  };

  const compareChartData = {
    labels: ["Average Query Time (ms)", "Max Query Time (ms)"],
    datasets: [
      {
        label: "Redis",
        data: [
          performanceData.reduce((acc, curr) => acc + curr.redisTime, 0) /
            performanceData.length,
          Math.max(...performanceData.map((d) => d.redisTime)),
        ],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
      {
        label: "SQL",
        data: [
          performanceData.reduce((acc, curr) => acc + curr.sqlTime, 0) /
            performanceData.length,
          Math.max(...performanceData.map((d) => d.sqlTime)),
        ],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        marginLeft: 3,
        background: "linear-gradient(145deg, #ffffffff, #ffffffff)",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: "black" }}>
        Performance Metrics
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: "black" }}>
            Query Response Times
          </Typography>
          <Box sx={{ height: 200 }}>
            <Line
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Response Time (ms)",
                    },
                  },
                },
                animation: false,
              }}
              data={latencyChartData}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Performance Comparison
          </Typography>
          <Box sx={{ height: 200 }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Time (ms)",
                    },
                  },
                },
              }}
              data={compareChartData}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

function PipelineDiagram() {
  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 4,
        background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Pipeline Architecture
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: "500px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <img
          src="/pipeline_diagram.png"
          alt="Pipeline Architecture"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "white",
          }}
        />
      </Box>
    </Paper>
  );
}

function PublisherSettings() {
  const { loading, error, data } = useQuery(PUBLISHER_CONFIG_QUERY, {
    pollInterval: 5000,
  });

  const [updateConfig] = useMutation(UPDATE_PUBLISHER_CONFIG, {
    refetchQueries: [{ query: PUBLISHER_CONFIG_QUERY }],
  });

  const [batchSize, setBatchSize] = useState<number>(2);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(20);

  // Update local state when query data arrives
  useEffect(() => {
    if (data?.publisherConfig) {
      setBatchSize(data.publisherConfig.batchSize);
      setIntervalSeconds(data.publisherConfig.intervalSeconds);
    }
  }, [data]);

  const handleUpdate = () => {
    updateConfig({
      variables: {
        batchSize: parseInt(String(batchSize)),
        intervalSeconds: parseInt(String(intervalSeconds)),
      },
    });
  };

  if (loading) return <CircularProgress />;
  // if (error) return <Alert severity="error">Error loading publisher settings</Alert>;

  return (
    <>
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          marginBottom: 2,
          background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
          borderRadius: 4,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Publisher Settings
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              label="Batch Size"
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Interval (seconds)"
              type="number"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={handleUpdate}
              fullWidth
              sx={{ height: "56px" }}
            >
              Update
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}

function LeaderboardDashboard() {
  const [limit, setLimit] = useState(10);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const { loading, error, data } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit },
    pollInterval: 5000,
    onCompleted: (data) => {
      // Record actual performance data from server
      const newMetric: PerformanceData = {
        timestamp: Date.now(),
        redisTime: data.redis?.metrics.queryTime || 0,
        sqlTime: data.sql?.metrics.queryTime || 0,
        dataSize: data.redis?.metrics.recordCount || 0,
      };

      setPerformanceData((prev) => {
        const newData = [...prev, newMetric];
        // Keep last 20 data points
        return newData.slice(-20);
      });
    },
  });

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setLimit(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(event.target.value === "" ? 0 : Number(event.target.value));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <PipelineDiagram />
      <Grid container>
        <Grid item xs={6} md={6} lg={6}>
          {/* Content for the left pane */}
          <PublisherSettings />
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              marginBottom: 2,
              background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
              borderRadius: 4,
            }}
          >
            <Typography id="input-slider" gutterBottom>
              Number of Top Players to Display
            </Typography>
            <Grid alignItems="center">
              <Grid item xs>
                <Slider
                  size="small"
                  value={typeof limit === "number" ? limit : 0}
                  onChange={handleSliderChange}
                  aria-labelledby="input-slider"
                  valueLabelDisplay="auto"
                  min={1}
                  max={100}
                />
              </Grid>
            </Grid>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  borderRadius: 4,
                  p: { xs: 2, sm: 3, md: 4 },
                  background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
                  height: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Redis Leaderboard
                  {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to fetch Redis leaderboard data.
                  </Alert>
                )}
                <TableContainer>
                  <Table aria-label="redis leaderboard table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Score
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.redis?.data?.map((entry: any) => (
                        <TableRow
                          key={entry.user_id}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "rgba(0, 0, 0, 0.2)",
                            },
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                            },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {entry.rank}
                          </TableCell>
                          <TableCell>{entry.user_name}</TableCell>
                          <TableCell align="right">{entry.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  borderRadius: 4,
                  p: { xs: 2, sm: 3, md: 4 },
                  background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
                  height: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  SQL Leaderboard
                  {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to fetch SQL leaderboard data.
                  </Alert>
                )}
                <TableContainer>
                  <Table aria-label="sql leaderboard table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Score
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.sql?.data?.map((entry: any) => (
                        <TableRow
                          key={entry.user_id}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "rgba(0, 0, 0, 0.2)",
                            },
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                            },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {entry.rank}
                          </TableCell>
                          <TableCell>{entry.user_name}</TableCell>
                          <TableCell align="right">{entry.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          {/* Content for the right pane */}
          <PerformanceMetrics performanceData={performanceData} />
        </Grid>
      </Grid>
    </Container>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh" }}>
          <AppBar position="fixed">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Leaderboard Dashboard
              </Typography>
              <Button color="inherit">Login</Button>
            </Toolbar>
          </AppBar>
          <Toolbar />
          <LeaderboardDashboard />
        </Box>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
