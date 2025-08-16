import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";
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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
} from "@mui/material";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupIcon from "@mui/icons-material/Group";
import MenuIcon from "@mui/icons-material/Menu";

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

const client = new ApolloClient({
  uri: "http://localhost:8080/query",
  cache: new InMemoryCache(),
});

const LEADERBOARD_QUERY = gql`
  query GetLeaderboard {
    leaderboard {
      rank
      user_id
      user_name
      score
    }
  }
`;

function LeaderboardDashboard() {
  const { loading, error, data } = useQuery(LEADERBOARD_QUERY, {
    pollInterval: 5000,
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper
            sx={{
              borderRadius: 4,
              p: { xs: 2, sm: 3, md: 4 },
              background: "linear-gradient(145deg, #6d6d6dff, #595757ff)",
            }}
          >
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to fetch leaderboard data. Please try again later.
              </Alert>
            )}
            <TableContainer>
              <Table aria-label="leaderboard table">
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
                  {data?.leaderboard.map((entry: any) => (
                    <TableRow
                      key={entry.user_id}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(0, 0, 0, 0.2)",
                        },
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.4)" },
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
