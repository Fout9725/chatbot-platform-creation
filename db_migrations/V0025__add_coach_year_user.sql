-- Добавляем пользователя @coach_year с PRO подпиской
INSERT INTO t_p60354232_chatbot_platform_cre.neurophoto_users 
(telegram_id, username, first_name, paid_generations, free_generations, total_used) 
VALUES 
(1000000001, 'coach_year', 'Coach Year', 999999, 0, 0)
ON CONFLICT (telegram_id) DO UPDATE SET 
paid_generations = 999999, 
username = 'coach_year', 
first_name = 'Coach Year';