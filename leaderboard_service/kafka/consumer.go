package kafka

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/segmentio/kafka-go"
)

const (
	topic               = "leaderboard-scores"
	brokerAddress       = "kafka:9092"
	RedisLeaderboardKey = "leaderboard" // Capitalized to make it exported
)

type UserScore struct {
	UserID   string `json:"user_id"`
	UserName string `json:"user_name"`
	Score    int    `json:"score"`
}

func StartConsumer(ctx context.Context, db *sql.DB, rdb *redis.Client) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{brokerAddress},
		Topic:          topic,
		GroupID:        "leaderboard-consumers",
		MinBytes:       10e3, // 10KB
		MaxBytes:       10e6, // 10MB
		CommitInterval: time.Second,
	})
	defer r.Close()

	log.Println("Kafka consumer started...")

	for {
		select {
		case <-ctx.Done():
			log.Println("Shutting down Kafka consumer...")
			return
		default:
			m, err := r.FetchMessage(ctx)
			if err != nil {
				log.Printf("Error fetching message: %v", err)
				continue
			}

			var userScore UserScore
			if err := json.Unmarshal(m.Value, &userScore); err != nil {
				log.Printf("Error unmarshalling message: %v", err)
				r.CommitMessages(ctx, m)
				continue
			}

			log.Printf("Consumed message for user %s with score %d", userScore.UserName, userScore.Score)

			// Update Redis Sorted Set
			err = rdb.ZAdd(ctx, RedisLeaderboardKey, &redis.Z{
				Score:  float64(userScore.Score),
				Member: userScore.UserID,
			}).Err()
			if err != nil {
				log.Printf("Error updating Redis: %v", err)
			}

			// Upsert into PostgreSQL for persistence
			upsertSQL := `INSERT INTO leaderboard (user_id, user_name, score) VALUES ($1::uuid, $2, $3) ON CONFLICT (user_id) DO UPDATE SET score = EXCLUDED.score, user_name = EXCLUDED.user_name;`
			if _, err := db.ExecContext(ctx, upsertSQL, userScore.UserID, userScore.UserName, userScore.Score); err != nil {
				log.Printf("Error upserting to PostgreSQL: %v", err)
			}

			r.CommitMessages(ctx, m)
		}
	}
}
