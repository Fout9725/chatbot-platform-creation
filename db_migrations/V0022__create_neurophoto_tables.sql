-- Таблица пользователей бота Нейрофотосессия
CREATE TABLE IF NOT EXISTS neurophoto_users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    free_generations INTEGER DEFAULT 10,
    paid_generations INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    preferred_model TEXT DEFAULT 'google/gemini-2.5-flash-image-preview:free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица генераций изображений
CREATE TABLE IF NOT EXISTS neurophoto_generations (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES neurophoto_users(telegram_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_neurophoto_users_username ON neurophoto_users(username);
CREATE INDEX IF NOT EXISTS idx_neurophoto_generations_telegram_id ON neurophoto_generations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_neurophoto_generations_created_at ON neurophoto_generations(created_at);