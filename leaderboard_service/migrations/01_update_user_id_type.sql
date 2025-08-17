-- First, we'll drop existing data and constraints
DROP TABLE IF EXISTS leaderboard;

-- Recreate the table with UUID type for user_id
CREATE TABLE leaderboard (
    user_id UUID PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0
);

-- Create an index on score for faster ranking queries
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
