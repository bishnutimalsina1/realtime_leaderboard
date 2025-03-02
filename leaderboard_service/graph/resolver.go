package graph

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.
import (
	"database/sql"
	"log"
)

type Resolver struct {
	DB *sql.DB
}

func updateRanks(db *sql.DB) {
    rows, err := db.Query("SELECT user_id FROM leaderboard ORDER BY score DESC")
    if err != nil {
        log.Fatalf("failed to fetch leaderboard: %v", err)
    }
    defer rows.Close()

    rank := 1
    for rows.Next() {
        var userID int
        if err := rows.Scan(&userID); err != nil {
            log.Fatalf("failed to scan user_id: %v", err)
        }
        _, err = db.Exec("UPDATE leaderboard SET rank = $1 WHERE user_id = $2", rank, userID)
        if err != nil {
            log.Fatalf("failed to update rank: %v", err)
        }
        rank++
    }
}