-- Таблица для хранения истории генераций изображений
CREATE TABLE IF NOT EXISTS neurophoto_generations (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    prompt TEXT NOT NULL,
    model VARCHAR(50) NOT NULL,
    effect VARCHAR(50),
    image_url TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generations_telegram_id ON neurophoto_generations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON neurophoto_generations(created_at DESC);