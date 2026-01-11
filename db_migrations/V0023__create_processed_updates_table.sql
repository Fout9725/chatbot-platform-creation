-- Таблица для хранения обработанных update_id (дедупликация запросов от Telegram)
CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.neurophoto_processed_updates (
    update_id BIGINT PRIMARY KEY,
    processed_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого удаления старых записей
CREATE INDEX IF NOT EXISTS idx_processed_updates_time 
ON t_p60354232_chatbot_platform_cre.neurophoto_processed_updates(processed_at);

COMMENT ON TABLE t_p60354232_chatbot_platform_cre.neurophoto_processed_updates IS 'Хранит обработанные update_id для предотвращения дублей запросов от Telegram';
