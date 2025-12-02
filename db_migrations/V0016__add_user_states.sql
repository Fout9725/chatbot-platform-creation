-- Создаем таблицу для хранения состояний пользователей
CREATE TABLE IF NOT EXISTS user_states (
    user_id BIGINT PRIMARY KEY,
    state VARCHAR(100) DEFAULT 'idle',
    state_data TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_states_state ON user_states(state);