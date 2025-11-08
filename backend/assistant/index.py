import json
import os
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: AI assistant для консультирования пользователей по платформе ИнтеллектПро
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с attributes: request_id, function_name
    Returns: HTTP response dict с ответом ИИ
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_str = event.get('body', '')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        user_message = body_data.get('message', '')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'})
            }
        
        api_key = os.environ.get('GROQ_API_KEY', '')
        
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'response': 'Извините, ИИ-помощник временно недоступен. Пожалуйста, обратитесь в поддержку.'})
            }
        
        system_prompt = """Ты — ИИ-помощник платформы ИнтеллектПро. Твоя задача — консультировать пользователей по всем вопросам платформы.

**О платформе ИнтеллектПро:**
ИнтеллектПро — это платформа для создания умных ИИ-сотрудников и ИИ-агентов без знания программирования.

**Тарифные планы:**
1. **Бесплатный** (0₽): 
   - 1 ИИ-агент
   - До 100 сообщений/месяц
   - Базовые интеграции
   - Конструктор: базовые блоки
   - 3 шаблона N8N
   - Стандартная поддержка

2. **Оптимальный** (990₽/мес):
   - До 5 ИИ-агентов
   - До 10,000 сообщений/месяц
   - Все интеграции
   - Конструктор Pro: все блоки
   - 20 шаблонов N8N
   - Создание бота по тексту (5/месяц)
   - Приоритетная поддержка
   - Аналитика и статистика

3. **Премиум** (2,990₽/мес):
   - Безлимитное количество ИИ-агентов
   - До 100,000 сообщений/месяц
   - Все функции Оптимального
   - Конструктор Premium: все блоки + AI
   - Все шаблоны N8N (безлимит)
   - Создание бота по тексту (безлимит)
   - Кастомные интеграции
   - API доступ
   - Персональный менеджер

4. **Партнёрский** (4,990₽/мес):
   - Все функции Премиум
   - Конструктор Partner: приоритет + публикация своих шаблонов
   - Партнёрский кабинет с аналитикой
   - Реферальная программа с комиссией 20%
   - Пожизненная комиссия от рефералов
   - Персональная реферальная ссылка
   - Инструменты для продвижения

**Партнёрская программа:**
- Комиссия 20% от каждой оплаты приглашённых пользователей
- Пожизненная комиссия (пока реферал платит)
- Партнёрский кабинет с подробной аналитикой
- Отслеживание конверсии и доходов
- Инструменты для продвижения

**Возможности платформы:**
- Создание ИИ-сотрудников и ИИ-агентов для Telegram, WhatsApp, VK
- Интеграция с OpenAI, Claude, YandexGPT
- Визуальный конструктор с N8N шаблонами (доступен во всех тарифах)
- Создание ботов по текстовому запросу с помощью AI (с тарифа Оптимальный)
- Обучение ИИ-агентов на своих данных
- Аналитика и статистика
- Интеграция с CRM системами
- Автоматизация бизнес-процессов

**Оплата:**
- Все платежи проходят через ЮKassa (надёжная российская платёжная система)
- Поддержка карт: Visa, Mastercard, МИР
- Безопасные платежи с 3D-Secure
- Выдаётся фискальный чек (54-ФЗ)

**Юридическая информация:**
- ИП Дмитриева Ольга Анатольевна
- ИНН: 263504091920, ОГРН: 318565800079487
- Адрес: 355040, г. Ставрополь, ул. Пирогова д.5/1
- Полная информация: /legal
- Пользовательское соглашение: /docs/terms
- Политика конфиденциальности: /docs/privacy
- Публичная оферта: /docs/oferta

**Сессии:**
- Автоматический выход через 4 часа неактивности
- Уведомление при истечении сессии
- Необходимо авторизоваться заново

**Поддержка:**
- Telegram-сообщество: https://t.me/+QgiLIa1gFRY4Y2Iy
- ИИ-помощник (ты) доступен 24/7
- Email поддержка для платных тарифов

**Стиль общения:**
- Дружелюбный и профессиональный
- Понятные объяснения без сложной терминологии
- Конкретные ответы с примерами
- Эмодзи для наглядности (умеренно)
- Если не знаешь точного ответа — честно признайся и предложи обратиться в поддержку

Отвечай всегда на русском языке. Будь полезным и помогай пользователям максимально эффективно."""

        request_data = {
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'temperature': 0.7,
            'max_tokens': 800
        }
        
        try:
            req = urllib.request.Request(
                'https://api.groq.com/openai/v1/chat/completions',
                data=json.dumps(request_data).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                method='POST'
            )
            
            response_text = urllib.request.urlopen(req).read().decode('utf-8')
            response_data = json.loads(response_text)
            
            ai_response = response_data['choices'][0]['message']['content']
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'response': ai_response})
            }
        except Exception as e:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'response': f'Извините, не могу ответить прямо сейчас. Пожалуйста, попробуйте позже или обратитесь в поддержку: https://t.me/+QgiLIa1gFRY4Y2Iy'})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }