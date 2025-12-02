-- Создаем таблицу для шаблонов опросов
CREATE TABLE IF NOT EXISTS poll_templates (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    chat_id BIGINT NOT NULL,
    poll_question TEXT NOT NULL,
    poll_options TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу для запланированных опросов
CREATE TABLE IF NOT EXISTS scheduled_polls (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES poll_templates(id),
    user_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    poll_question TEXT NOT NULL,
    poll_options TEXT[] NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_poll_templates_user_id ON poll_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_polls_status_time ON scheduled_polls(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_polls_user_id ON scheduled_polls(user_id);