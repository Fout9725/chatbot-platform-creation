
-- Деактивируем всех в platform_users
UPDATE t_p60354232_chatbot_platform_cre.platform_users SET is_active = false, role = 'disabled';

-- Деактивируем всех в users
UPDATE t_p60354232_chatbot_platform_cre.users SET role = 'disabled';

-- Обновляем сессии - истекаем все
UPDATE t_p60354232_chatbot_platform_cre.admin_sessions SET expires_at = '2020-01-01 00:00:00';

-- Обновляем запись id=1 в platform_users под нового админа
UPDATE t_p60354232_chatbot_platform_cre.platform_users 
SET email = 'admin@avmin.local',
    username = 'A/Vmin',
    password_hash = encode(sha256('vovan.ru97'::bytea), 'hex'),
    full_name = 'A/Vmin Admin',
    is_active = true,
    role = 'admin',
    email_verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Обновляем запись id=60 в users (был admin) под нового админа
UPDATE t_p60354232_chatbot_platform_cre.users 
SET email = 'admin@avmin.local',
    full_name = 'A/Vmin Admin',
    role = 'admin',
    password_hash = encode(sha256('vovan.ru97'::bytea), 'hex'),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 60;
