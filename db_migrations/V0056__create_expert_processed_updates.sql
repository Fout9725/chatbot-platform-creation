CREATE TABLE IF NOT EXISTS expert_processed_updates (
    update_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);