-- Создание таблицы для истории создания ботов через ИИ-агента

CREATE TABLE IF NOT EXISTS bot_builder_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('visual', 'professional')),
    user_prompt TEXT NOT NULL,
    bot_config JSONB NOT NULL,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_builder_user_id ON bot_builder_history(user_id);
CREATE INDEX idx_bot_builder_created_at ON bot_builder_history(created_at DESC);
CREATE INDEX idx_bot_builder_mode ON bot_builder_history(mode);

COMMENT ON TABLE bot_builder_history IS 'История создания ботов через ИИ-агента';
COMMENT ON COLUMN bot_builder_history.user_id IS 'ID пользователя из AuthContext';
COMMENT ON COLUMN bot_builder_history.mode IS 'Режим конструктора: visual или professional';
COMMENT ON COLUMN bot_builder_history.user_prompt IS 'Текстовый запрос пользователя';
COMMENT ON COLUMN bot_builder_history.bot_config IS 'JSON конфигурация сгенерированного бота';
COMMENT ON COLUMN bot_builder_history.conversation_history IS 'История диалога с ИИ-агентом';
