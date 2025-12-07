INSERT INTO bots (name, bot_type, platform, description, telegram_token, telegram_username, status, scenarios, settings, ai_model) 
VALUES (
  'Опросник', 
  'chatbot', 
  'telegram', 
  'Telegram бот для создания и проведения опросов с расписанием', 
  '8059737467:AAEywpOOuZBvzCu35gSqZetsxgZzwULHCjc', 
  'helplide_bot', 
  'active', 
  '[{"type": "greeting", "text": "Привет! Я помогу создать и провести опросы. Используй команды:\\n/create - создать опрос\\n/schedule - расписание\\n/results - результаты"}, {"type": "poll_creation", "fields": ["question", "options", "schedule"]}]'::jsonb, 
  '{"auto_reply": true, "multiple_answers": true, "analytics": true}'::jsonb, 
  'google/gemini-2.0-flash-exp:free'
);