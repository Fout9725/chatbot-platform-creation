-- Обновление моделей AI для всех ботов на OpenRouter модели
-- Для чат-ботов и поддержки - текстовые модели
UPDATE bots SET ai_model = 'google/gemini-2.0-flash-exp:free' WHERE bot_type = 'chatbot';

-- Для AI-агентов - продвинутые текстовые модели
UPDATE bots SET ai_model = 'deepseek/deepseek-chat-v3-0324:free' WHERE bot_type = 'ai-agent';

-- Для AI-сотрудников - модели для бизнес-задач
UPDATE bots SET ai_model = 'google/gemma-3-27b-it:free' WHERE bot_type = 'ai-employee';