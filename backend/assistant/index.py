import json
import os
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''AI assistant для консультирования пользователей по платформе ИнтеллектПро'''
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
        context = body_data.get('context', '')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'})
            }
        
        openrouter_key = os.environ.get('OPENROUTER_API_KEY', '')
        
        if not openrouter_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'response': 'Извините, ИИ-помощник временно недоступен. Пожалуйста, обратитесь к администратору @Fou9725'})
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

2. **Оптимальный** (990₽/мес или 10,692₽/год со скидкой 10%):
   - До 5 ИИ-агентов
   - До 10,000 сообщений/месяц
   - Все интеграции
   - Конструктор Pro: все блоки
   - 20 шаблонов N8N
   - Создание бота по тексту (5/месяц)
   - Приоритетная поддержка
   - Аналитика и статистика

3. **Премиум** (2,990₽/мес или 30,498₽/год со скидкой 15%):
   - Безлимитное количество ИИ-агентов
   - До 100,000 сообщений/месяц
   - Все функции Оптимального
   - Конструктор Premium: все блоки + AI
   - Все шаблоны N8N (безлимит)
   - Создание бота по тексту (безлимит)
   - Кастомные интеграции
   - API доступ
   - Персональный менеджер

4. **Партнёрский** (9,990₽/мес или 95,904₽/год со скидкой 20%):
   - Все функции Премиум
   - Конструктор Partner: приоритет + публикация своих шаблонов
   - Партнёрский кабинет с аналитикой
   - Реферальная программа с комиссией 20%
   - Пожизненная комиссия от рефералов
   - Персональная реферальная ссылка
   - Инструменты для продвижения

💡 **Выгодно!** Чем дороже тариф, тем больше скидка при годовой оплате:
- Оптимальный: экономия 10% (1,188₽)
- Премиум: экономия 15% (5,382₽)
- Партнёрский: экономия 20% (23,976₽)

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
- Все платежи проходят через Prodamus (надёжная российская платёжная система)
- Поддержка: Банковские карты, СБП, Apple Pay, Google Pay
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
- ИИ-помощник (ты) доступен 24/7
- Telegram-сообщество: https://t.me/+QgiLIa1gFRY4Y2Iy

**Прямая связь с администрацией:**
Если пользователь хочет связаться напрямую с человеком или системным администратором, предоставь эти контакты:
- 👤 Системный Администратор: Владимир
- ✈️ Telegram: @Fou9725
Эти контакты используй для всех вопросов технической поддержки, проблем с платформой и прямого общения с администрацией.

**Стиль общения:**
- Дружелюбный и профессиональный
- Понятные объяснения без сложной терминологии
- Конкретные ответы с примерами
- Эмодзи для наглядности (умеренно)
- Если не знаешь точного ответа — честно признайся и предложи обратиться к администратору @Fou9725

Отвечай всегда на русском языке. Будь полезным и помогай пользователям максимально эффективно."""

        # Специальная обработка для продолжения ответа
        is_continue = user_message.lower() in ['продолжи ответ', 'продолжи', 'continue']
        
        if is_continue and context:
            # Для продолжения - используем упрощённый промпт без размышлений
            messages = [
                {'role': 'system', 'content': 'Продолжи текст без вступлений и размышлений. Просто продолжи с того места, где остановился:'},
                {'role': 'assistant', 'content': context},
                {'role': 'user', 'content': 'Продолжи'}
            ]
        else:
            messages = [{'role': 'system', 'content': system_prompt}]
            if context:
                messages.append({'role': 'assistant', 'content': context})
            messages.append({'role': 'user', 'content': user_message})
        
        request_data = {
            'model': 'nvidia/nemotron-3-nano-30b-a3b:free',
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 4000
        }
        api_url = 'https://openrouter.ai/api/v1/chat/completions'
        
        # Retry механизм - пытаемся 2 раза при timeout
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                print(f'Making request to OpenRouter API (attempt {attempt + 1}/{max_retries}) with model: nvidia/nemotron-3-nano-30b-a3b:free')
                req = urllib.request.Request(
                    api_url,
                    data=json.dumps(request_data).encode('utf-8'),
                    headers={
                        'Authorization': f'Bearer {openrouter_key}',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://intellektpro.ru',
                        'X-Title': 'IntellektPro AI Assistant'
                    },
                    method='POST'
                )
                
                response = urllib.request.urlopen(req, timeout=55)
                response_data = json.loads(response.read().decode('utf-8'))
                
                print(f'OpenRouter response received')
                
                msg = response_data['choices'][0]['message']
                full_response = (msg.get('content') or '').strip()
                reasoning = (msg.get('reasoning') or '').strip()
                print(f'Raw content (first 200 chars): {full_response[:200]}')
                print(f'Raw reasoning (first 200 chars): {reasoning[:200]}')
                if not full_response and reasoning:
                    full_response = reasoning
                
                # Убираем размышления модели
                import re
                
                # Удаляем теги размышлений
                full_response = re.sub(r'<think>.*?</think>', '', full_response, flags=re.DOTALL | re.IGNORECASE)
                full_response = re.sub(r'<thinking>.*?</thinking>', '', full_response, flags=re.DOTALL | re.IGNORECASE)
                
                # Паттерны начала размышлений
                thinking_start_patterns = [
                    'Хорошо, пользователь', 'Итак, пользователь', 'Пользователь спрашивает',
                    'Пользователь запросил', 'Пользователь хочет', 'Мне нужно',
                    'Сначала я', 'Давайте'
                ]
                
                # Если ответ начинается с размышления - удаляем весь первый абзац до \n\n
                starts_with_thinking = any(full_response.startswith(pattern) for pattern in thinking_start_patterns)
                
                if starts_with_thinking and '\n\n' in full_response:
                    # Удаляем всё до первого двойного переноса (это размышление)
                    parts = full_response.split('\n\n', 1)
                    if len(parts) > 1:
                        full_response = parts[1].strip()
                        print(f'Removed thinking block, new response starts with: {full_response[:100]}')
                
                # Убираем форматирование markdown
                full_response = full_response.replace('**', '')
                full_response = full_response.replace('###', '')
                full_response = full_response.replace('##', '')
                full_response = full_response.replace('#', '')
                
                # Убираем лишние пробелы и переносы строк
                full_response = '\n'.join(line.strip() for line in full_response.split('\n') if line.strip())
                
                print(f'Cleaned response (first 200 chars): {full_response[:200]}')
                
                truncated = len(full_response) >= 450
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'response': full_response.strip(),
                        'truncated': truncated
                    })
                }
            except urllib.error.HTTPError as e:
                print(f'HTTP ERROR in assistant (attempt {attempt + 1}): {e.code} {str(e)}')
                if e.code == 429:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'response': '⏳ Превышен лимит бесплатных запросов к ИИ. Попробуйте через минуту или обратитесь к администратору @Fou9725 для увеличения лимита.'})
                    }
                # Для других HTTP ошибок - повторяем попытку
                if attempt < max_retries - 1:
                    print(f'Retrying request...')
                    continue
            except Exception as e:
                print(f'ERROR in assistant (attempt {attempt + 1}): {str(e)}')
                import traceback
                print(f'Traceback: {traceback.format_exc()}')
                
                # Если это timeout - пробуем ещё раз
                if 'timeout' in str(e).lower() and attempt < max_retries - 1:
                    print(f'Timeout detected, retrying...')
                    continue
        
        # Если все попытки исчерпаны
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'response': f'Извините, не могу ответить прямо сейчас. Попробуйте ещё раз через минуту или обратитесь к администратору: @Fou9725'})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }