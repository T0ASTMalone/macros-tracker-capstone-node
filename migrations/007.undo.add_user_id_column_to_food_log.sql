ALTER TABLE food_log 
    DROP COLUMN
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL