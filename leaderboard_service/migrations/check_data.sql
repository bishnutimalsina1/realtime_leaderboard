-- Show all records in leaderboard table ordered by score
SELECT 
    user_id,
    user_name,
    score,
    rank,
    user_id::text as user_id_text  -- Also show UUID as text for readability
FROM leaderboard 
ORDER BY score DESC;
