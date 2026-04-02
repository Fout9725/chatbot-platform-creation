BOT_BUILDING_KNOWLEDGE = """
# База знаний: Создание ботов в ИнтеллектПро

## 1. ВИЗУАЛЬНЫЙ КОНСТРУКТОР (N8N-подобный)

### Основные принципы:
- Визуальный drag & drop интерфейс для создания ботов без кода
- Работа с нодами (узлами) и их соединениями
- Поддержка множества интеграций (Telegram, WhatsApp, VK)
- Автоматическая валидация логики

### Основные типы нодов:

**Триггеры (Triggers):**
- `Webhook` - получение входящих сообщений от пользователей
- `Telegram Trigger` - специальный триггер для Telegram
- `WhatsApp Trigger` - триггер для WhatsApp
- `Schedule` - запуск по расписанию
- `Chat Message` - триггер входящего сообщения в чат

**Обработка данных:**
- `Function` - обработка входящих данных JavaScript
- `Switch` - условная маршрутизация на основе данных
- `IF` - простое условие if/else
- `Merge` - объединение нескольких потоков данных
- `Filter` - фильтрация данных по условиям

**AI и языковые модели:**
- `AI Agent` - ядро AI-агента с поддержкой памяти
- `OpenAI Chat Model` - интеграция с OpenAI (GPT-4, GPT-3.5)
- `Claude Chat Model` - интеграция с Anthropic Claude
- `DeepSeek Model` - интеграция с DeepSeek
- `YandexGPT` - российская языковая модель
- `AI Memory` - память для контекста разговора (Simple Memory, Buffer Memory)

**Интеграции:**
- `HTTP Request` - запросы к внешним API
- `Telegram Send Message` - отправка сообщений в Telegram
- `Database` - работа с базами данных
- `CRM Integration` - интеграция с CRM системами
- `Email` - отправка email
- `Webhook Response` - ответ на webhook

**Данные и хранилище:**
- `Set` - установка переменных
- `Code` - выполнение пользовательского кода
- `Vector Store` - хранилище векторных embeddings для RAG
- `Pinecone` - векторная база данных

### Пример простого бота поддержки:
```
1. Telegram Trigger (получение сообщения)
   ↓
2. AI Agent (обработка запроса с памятью)
   ├─ OpenAI Chat Model (GPT-4)
   ├─ Simple Memory (хранение истории)
   └─ System Prompt: "Ты помощник службы поддержки"
   ↓
3. Telegram Send Message (отправка ответа)
```

### Пример бота с базой знаний (RAG):
```
Этап 1: Индексация данных
1. HTTP Request (получение документации)
   ↓
2. Text Splitter (разбивка на чанки)
   ↓
3. OpenAI Embeddings (создание векторов)
   ↓
4. Pinecone Vector Store (сохранение)

Этап 2: Чат с ботом
1. Chat Trigger (получение вопроса)
   ↓
2. Pinecone Search (поиск релевантных чанков)
   ↓
3. AI Agent
   ├─ OpenAI Chat Model
   ├─ Retrieved Context (найденные данные)
   └─ System Prompt: "Отвечай на основе документации"
   ↓
4. Chat Response (отправка ответа)
```

## 2. ПРОФЕССИОНАЛЬНЫЙ РЕЖИМ (Код)

### Telegram Bot на Python:

**Базовая структура:**
```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters

async def start(update: Update, context):
    await update.message.reply_text('Привет! Я бот помощник.')

async def handle_message(update: Update, context):
    user_message = update.message.text
    # Обработка сообщения
    response = process_with_ai(user_message)
    await update.message.reply_text(response)

def main():
    application = Application.builder().token("YOUR_BOT_TOKEN").build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT, handle_message))
    
    application.run_polling()
```

**Создание бота через BotFather:**
1. Открыть Telegram, найти @BotFather
2. Отправить команду /newbot
3. Указать имя бота (например: "Мой Помощник")
4. Указать username бота (должен заканчиваться на bot: myhelper_bot)
5. Получить токен API (сохранить в безопасном месте!)

**Интеграция с AI (OpenAI):**
```python
import openai

def process_with_ai(user_message, conversation_history=[]):
    conversation_history.append({"role": "user", "content": user_message})
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Ты полезный ассистент"},
            *conversation_history
        ]
    )
    
    ai_response = response.choices[0].message.content
    conversation_history.append({"role": "assistant", "content": ai_response})
    
    return ai_response
```

**Кнопки и inline клавиатуры:**
```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

async def show_menu(update: Update, context):
    keyboard = [
        [InlineKeyboardButton("Помощь", callback_data='help')],
        [InlineKeyboardButton("Настройки", callback_data='settings')],
        [InlineKeyboardButton("О боте", callback_data='about')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Выберите действие:', reply_markup=reply_markup)
```

**Работа с состояниями (ConversationHandler):**
```python
from telegram.ext import ConversationHandler

NAME, AGE = range(2)

async def start_registration(update, context):
    await update.message.reply_text('Как вас зовут?')
    return NAME

async def get_name(update, context):
    context.user_data['name'] = update.message.text
    await update.message.reply_text('Сколько вам лет?')
    return AGE

async def get_age(update, context):
    context.user_data['age'] = update.message.text
    await update.message.reply_text(f"Спасибо, {context.user_data['name']}!")
    return ConversationHandler.END

conv_handler = ConversationHandler(
    entry_points=[CommandHandler('register', start_registration)],
    states={
        NAME: [MessageHandler(filters.TEXT, get_name)],
        AGE: [MessageHandler(filters.TEXT, get_age)]
    },
    fallbacks=[]
)
```

## 3. ЛУЧШИЕ ПРАКТИКИ

### Для визуального конструктора:
1. **Начинайте с простого** - один триггер → обработка → один ответ
2. **Используйте память** - добавляйте Simple Memory для контекста
3. **Тестируйте каждый шаг** - используйте кнопку "Test" на каждом ноде
4. **Добавляйте обработку ошибок** - используйте Error Trigger для fallback
5. **Оптимизируйте промпты** - четкие инструкции в System Prompt
6. **Разделяйте логику** - создавайте отдельные workflow для разных задач

### Для профессионального режима:
1. **Безопасность токенов** - храните токены в переменных окружения
2. **Обработка ошибок** - всегда используйте try/except
3. **Async/await** - используйте асинхронные функции
4. **Лимиты API** - следите за rate limits Telegram (30 сообщений/сек)
5. **Логирование** - добавляйте logging для отладки
6. **Управление состоянием** - используйте ConversationHandler для диалогов
7. **Кнопки вместо текста** - упрощают UX для пользователей

### Типичные сценарии ботов:

**1. Бот службы поддержки:**
- Trigger: Telegram/WhatsApp message
- AI Agent с базой знаний (RAG)
- Routing: если AI не может помочь → переключение на человека
- Memory: сохранение истории разговора

**2. Бот для уведомлений:**
- Trigger: Webhook от внешней системы
- Processing: форматирование данных
- Send: массовая рассылка пользователям

**3. Бот для сбора обратной связи:**
- Trigger: команда /feedback
- ConversationHandler: последовательный сбор данных
- Database: сохранение в БД
- Notification: уведомление администратора

**4. E-commerce бот:**
- Catalog browsing с inline кнопками
- Shopping cart управление
- Payment processing интеграция
- Order tracking через API

**5. AI-агент с инструментами:**
- AI Agent node
- Tools: Weather API, Search API, Database
- Autonomous decision making
- Multi-step reasoning

## 4. ПРОДВИНУТЫЕ ТЕХНИКИ

### RAG (Retrieval Augmented Generation):
```
1. Подготовка данных → загрузка документов
2. Chunking → разбивка на части (500-1000 токенов)
3. Embedding → векторизация через OpenAI/Cohere
4. Vector Store → сохранение в Pinecone/Qdrant
5. Retrieval → поиск релевантных чанков
6. Generation → AI генерирует ответ на основе данных
```

### Multi-Agent системы:
- Специализированные агенты для разных задач
- Routing agent определяет, какой агент вызвать
- Агенты могут вызывать друг друга
- Supervisor agent координирует работу

### Персонализация:
- Сохранение профиля пользователя в БД
- Использование переменных для подстановки имени
- Адаптация тона на основе предпочтений
- A/B тестирование разных промптов

### Аналитика:
- Логирование всех взаимодействий
- Метрики: response time, user satisfaction, completion rate
- Dashboards для мониторинга
- Улучшение на основе данных

## 5. ЧАСТЫЕ ОШИБКИ И РЕШЕНИЯ

**Ошибка: Бот не отвечает**
- Проверьте токен бота
- Убедитесь что webhook не конфликтует с polling
- Проверьте права бота в группе

**Ошибка: AI дает неправильные ответы**
- Улучшите system prompt (будьте конкретнее)
- Добавьте примеры (few-shot learning)
- Увеличьте температуру для креативности (или уменьшите для точности)
- Добавьте базу знаний (RAG)

**Ошибка: Бот забывает контекст**
- Добавьте Memory node в визуальном конструкторе
- В коде используйте context.user_data для хранения
- Увеличьте размер окна памяти

**Ошибка: Медленные ответы**
- Используйте более быстрые модели (gpt-3.5-turbo)
- Оптимизируйте промпты (короче = быстрее)
- Кэшируйте частые запросы
- Используйте streaming для длинных ответов

**Ошибка: Превышен лимит токенов**
- Сократите system prompt
- Уменьшите размер окна памяти
- Суммируйте старые сообщения
- Используйте модели с большим контекстом

## 6. ШАБЛОНЫ N8N WORKFLOW

### Базовый AI чат-бот:
Nodes: Chat Trigger → AI Agent (OpenAI + Simple Memory) → Chat Response

### Бот с функциями (Tools):
Nodes: Chat Trigger → AI Agent → Tools (HTTP, Database, Calendar) → Chat Response

### RAG Knowledge Bot:
Setup: Document Loader → Text Splitter → Embeddings → Vector Store
Chat: Chat Trigger → Vector Search → AI Agent (with context) → Chat Response

### Multi-channel бот:
Nodes: Multiple Triggers (Telegram + WhatsApp + VK) → Router → AI Agent → Channel-specific Response

### Scheduled notifications:
Nodes: Schedule Trigger → Database Query → AI Format → Telegram Broadcast

## 7. РЕКОМЕНДАЦИИ ПО ПРОМПТАМ

**Структура хорошего system prompt:**
```
Роль: Ты [описание роли]
Контекст: [информация о компании/продукте]
Задача: Твоя задача - [конкретные действия]
Ограничения: Не [что не делать]
Тон: Общайся [формально/дружелюбно/и т.д.]
Формат ответа: [как структурировать ответ]
```

**Пример для службы поддержки:**
```
Ты - ИИ-ассистент службы поддержки компании ИнтеллектПро.

Контекст: ИнтеллектПро - это платформа для создания AI-ботов и автоматизации.

Твои задачи:
1. Отвечать на вопросы о функциях платформы
2. Помогать решать технические проблемы
3. Направлять к документации когда нужно
4. Если не знаешь ответ - честно признайся и предложи связаться с человеком

Ограничения:
- Не делай обещаний о новых функциях
- Не разглашай внутреннюю информацию
- Не обсуждай конкурентов

Тон: Дружелюбный и профессиональный, используй эмодзи умеренно

Формат: Давай короткие и понятные ответы. Используй списки для пошаговых инструкций.
```

## 8. ДЕПЛОЙ И ХОСТИНГ

### Локальная разработка:
- Используйте ngrok для тестирования webhooks
- Python: python-telegram-bot с polling
- n8n: локальный docker контейнер

### Production деплой:
- Cloud hosting: Heroku, Railway, Render, Fly.io
- VPS: DigitalOcean, Linode, AWS EC2
- Serverless: AWS Lambda, Google Cloud Functions
- n8n Cloud: полностью управляемая версия

### Best practices для продакшена:
- Используйте webhook вместо polling (эффективнее)
- Настройте мониторинг и алерты
- Храните секреты в переменных окружения
- Настройте автоматический перезапуск при падении
- Логируйте ошибки в систему мониторинга (Sentry, LogRocket)
"""
