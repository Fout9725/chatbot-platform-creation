-- Таблица для очереди генераций изображений
CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.neurophoto_queue (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    model VARCHAR(50) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    image_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_neurophoto_queue_status ON t_p60354232_chatbot_platform_cre.neurophoto_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_neurophoto_queue_telegram_id ON t_p60354232_chatbot_platform_cre.neurophoto_queue(telegram_id);