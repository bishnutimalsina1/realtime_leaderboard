package main

import (
	"database/sql"
	"fmt"
	"leaderboard_service/graph"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	_ "github.com/lib/pq" // Import PostgreSQL driver
	"github.com/rs/cors"
	"github.com/vektah/gqlparser/v2/ast"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Initialize the database connection
	db, err := initializeDatabase()
	if err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}
	defer db.Close() // Ensure the database connection is closed when the application exits

	// Create an instance of Resolver and assign the DB connection
	resolver := &graph.Resolver{
		DB: db,
	}

	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))

	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173"},
		AllowCredentials: true,
		Debug: true,
	}).Handler

	log.Println("Resolver initialized successfully")

	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", corsHandler(srv))

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func initializeDatabase() (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=5432 user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))

	var db *sql.DB
	var err error

	// Retry logic
	for {
		db, err = sql.Open("postgres", connStr)
		if err != nil {
			log.Printf("Failed to open database connection: %v. Retrying in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		// Test the connection
		err = db.Ping()
		if err != nil {
			log.Printf("Failed to ping database: %v. Retrying in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			continue
		}
		log.Println("Successfully connected to the database")
		break
	}

	return db, nil
}
