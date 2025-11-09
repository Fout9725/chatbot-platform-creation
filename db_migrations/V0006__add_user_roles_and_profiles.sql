
-- Добавление роли пользователей в таблицу users
ALTER TABLE t_p60354232_chatbot_platform_cre.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Создание индекса для быстрого поиска администраторов
CREATE INDEX IF NOT EXISTS idx_users_role ON t_p60354232_chatbot_platform_cre.users(role);

-- Обновление существующих записей (если есть) для установки роли
UPDATE t_p60354232_chatbot_platform_cre.users 
SET role = 'admin' 
WHERE email IN ('admin@chatbot.ru', 'test@admin.com');

-- Создание таблицы для хранения профилей пользователей с детальной информацией
CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    login VARCHAR(255) UNIQUE,
    password_hash TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Добавление комментариев к таблицам
COMMENT ON COLUMN t_p60354232_chatbot_platform_cre.users.role IS 'Роль: admin, user, moderator';
COMMENT ON TABLE t_p60354232_chatbot_platform_cre.user_profiles IS 'Расширенные профили пользователей';
