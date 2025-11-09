-- Таблица для учёта пользователей бота Нейрофотосессия
CREATE TABLE IF NOT EXISTS neurophoto_users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    free_generations INT DEFAULT 3,
    paid_generations INT DEFAULT 0,
    total_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_generation_at TIMESTAMP
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_neurophoto_telegram_id ON neurophoto_users(telegram_id);

-- Индекс для статистики по дате последней генерации
CREATE INDEX IF NOT EXISTS idx_neurophoto_last_gen ON neurophoto_users(last_generation_at);