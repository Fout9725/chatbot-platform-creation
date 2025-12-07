CREATE TABLE IF NOT EXISTS bot_groups (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    chat_title TEXT NOT NULL,
    chat_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_groups_user_id ON bot_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_groups_chat_id ON bot_groups(chat_id);