import json
import os
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import urllib.parse
from datetime import datetime
import requests

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def send_telegram_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> bool:
    bot_token = os.environ.get('POLL_BOT_TOKEN')
    if not bot_token:
        print('ERROR: POLL_BOT_TOKEN not set')
        return False
    
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    data = {
        'chat_id': chat_id,
        'text': text[:4096],  # Telegram limit
        'parse_mode': 'Markdown'
    }
    
    if reply_markup:
        data['reply_markup'] = reply_markup
    
    try:
        response = requests.post(telegram_url, json=data, timeout=10)
        result = response.json()
        return result.get('ok', False)
    except Exception as e:
        print(f'Error sending message: {e}')
        return False

def send_telegram_poll(chat_id: int, question: str, options: List[str], allows_multiple_answers: bool = True) -> bool:
    bot_token = os.environ.get('POLL_BOT_TOKEN')
    if not bot_token:
        print('ERROR: POLL_BOT_TOKEN not set')
        return False
    
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendPoll'
    
    data = {
        'chat_id': chat_id,
        'question': question[:300],  # Telegram limit
        'options': [opt[:100] for opt in options[:10]],  # Limit each option and total count
        'is_anonymous': False,
        'allows_multiple_answers': allows_multiple_answers
    }
    
    try:
        response = requests.post(telegram_url, json=data, timeout=10)
        result = response.json()
        return result.get('ok', False)
    except Exception as e:
        print(f'Error sending poll: {e}')
        return False

def ask_ai_assistant(user_message: str) -> str:
    '''AI помощник для обработки вопросов и неожиданных запросов'''
    openrouter_key = os.environ.get('OPENROUTER_API_KEY')
    if not openrouter_key:
        return 'Извини, AI помощник временно недоступен. Используй кнопки меню.'
    
    system_prompt = '''Ты - AI помощник бота для автоматизации опросов в Telegram.

Твои задачи:
1. Помогать пользователям создавать шаблоны опросов
2. Объяснять как работает бот
3. Отвечать на вопросы про функции бота

Функции бота:
• Создание шаблонов опросов с постоянным списком людей
• Редактирование 1-2 позиций перед отправкой
• Планирование автоматической отправки опросов

Отвечай кратко и по делу. Если пользователь отправил случайный текст или что-то непонятное - вежливо подскажи использовать кнопки меню.'''
    
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {openrouter_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://poehali.dev',
                'X-Title': 'PollSchedulerBot'
            },
            json={
                'model': 'qwen/qwen-2.5-72b-instruct:free',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message[:500]}
                ],
                'temperature': 0.7,
                'max_tokens': 300
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('choices') and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
        
        return 'Извини, не могу обработать запрос. Используй кнопки меню 👇'
    except Exception as e:
        print(f'AI assistant error: {e}')
        return 'Используй кнопки меню для работы с ботом 👇'

def get_main_keyboard():
    return {
        'keyboard': [
            [{'text': '➕ Создать шаблон'}],
            [{'text': '📋 Мои шаблоны'}, {'text': '📅 Запланировать'}],
            [{'text': '🕐 Мои запланированные'}]
        ],
        'resize_keyboard': True
    }

def get_template_keyboard(templates: List[Dict]) -> Dict:
    keyboard = []
    for template in templates:
        keyboard.append([{
            'text': f"📝 {template['template_name']}"
        }])
    keyboard.append([{'text': '🔙 Назад'}])
    
    return {
        'keyboard': keyboard,
        'resize_keyboard': True
    }

def create_template(user_id: int, template_name: str, chat_id: int, question: str, options: List[str]) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO poll_templates (user_id, template_name, chat_id, poll_question, poll_options)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (user_id, template_name, chat_id, question, options))
    
    template_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return template_id

def get_user_templates(user_id: int) -> List[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, template_name, chat_id, poll_question, poll_options, created_at
        FROM poll_templates
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    templates = cur.fetchall()
    cur.close()
    conn.close()
    
    return templates

def get_template_by_name(user_id: int, template_name: str) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, template_name, chat_id, poll_question, poll_options
        FROM poll_templates
        WHERE user_id = %s AND template_name = %s
    """, (user_id, template_name))
    
    template = cur.fetchone()
    cur.close()
    conn.close()
    
    return template

def schedule_poll(template_id: int, user_id: int, chat_id: int, question: str, options: List[str], scheduled_time: datetime) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO scheduled_polls (template_id, user_id, chat_id, poll_question, poll_options, scheduled_time, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'pending')
        RETURNING id
    """, (template_id, user_id, chat_id, question, options, scheduled_time))
    
    poll_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return poll_id

def get_user_scheduled_polls(user_id: int) -> List[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, poll_question, scheduled_time, status, chat_id
        FROM scheduled_polls
        WHERE user_id = %s AND status IN ('pending', 'sent')
        ORDER BY scheduled_time DESC
        LIMIT 10
    """, (user_id,))
    
    polls = cur.fetchall()
    cur.close()
    conn.close()
    
    return polls

def save_user_state(user_id: int, state: str, data: Dict) -> None:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO user_states (user_id, state, state_data, updated_at)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET state = EXCLUDED.state, state_data = EXCLUDED.state_data, updated_at = CURRENT_TIMESTAMP
    """, (user_id, state, json.dumps(data)))
    
    conn.commit()
    cur.close()
    conn.close()

def get_user_state(user_id: int) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT state, state_data FROM user_states WHERE user_id = %s
    """, (user_id,))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if result:
        return {
            'state': result['state'],
            'data': json.loads(result['state_data']) if result['state_data'] else {}
        }
    return None

def clear_user_state(user_id: int) -> None:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("UPDATE user_states SET state = 'idle', state_data = NULL WHERE user_id = %s", (user_id,))
    
    conn.commit()
    cur.close()
    conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Telegram bot for scheduling polls with templates
    Args: event - Telegram webhook update
          context - cloud function context
    Returns: HTTP response
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        update = json.loads(event.get('body', '{}'))
        print(f'Received update: {json.dumps(update)}')
        
        if 'message' not in update:
            print('No message in update, skipping')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        message = update['message']
        chat_id = message['chat']['id']
        user_id = message['from']['id']
        text = message.get('text', '')
        
        print(f'Processing message from user {user_id}, chat {chat_id}: {text}')
    except Exception as e:
        print(f'Error parsing update: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    if text == '/start':
        welcome_text = '''👋 Привет! Я помогу автоматизировать твои опросы в Telegram.

*Что я умею:*
📝 Создавать шаблоны опросов с сохранением списка людей
✏️ Редактировать 1-2 позиции перед отправкой
📅 Планировать автоматическую отправку на нужное время

*Как начать:*
1️⃣ Создай шаблон с постоянным списком (те самые 30 человек)
2️⃣ При необходимости редактируй нужные позиции
3️⃣ Запланируй отправку на утро/обед/вечер

Используй кнопки ниже 👇'''
        
        send_telegram_message(chat_id, welcome_text, get_main_keyboard())
        clear_user_state(user_id)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    user_state = get_user_state(user_id)
    current_state = user_state['state'] if user_state else 'idle'
    state_data = user_state['data'] if user_state else {}
    
    if text == '🔙 Назад' or text == '/cancel':
        clear_user_state(user_id)
        send_telegram_message(chat_id, '✅ Действие отменено', get_main_keyboard())
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if text == '➕ Создать шаблон':
        send_telegram_message(chat_id, '📝 Введи название шаблона (например: "Обед" или "Утренний"):', {'remove_keyboard': True, 'selective': False})
        save_user_state(user_id, 'waiting_template_name', {})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'waiting_template_name':
        template_name = text.strip()
        send_telegram_message(chat_id, '📋 Введи вопрос для опроса (например: "Кто будет сегодня на обеде?"):', {'remove_keyboard': True, 'selective': False})
        save_user_state(user_id, 'waiting_question', {'template_name': template_name})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'waiting_question':
        question = text.strip()
        state_data['question'] = question
        send_telegram_message(chat_id, '''👥 Отправь список людей - по одному в строке:

*Пример:*
Иванов И.И.
Петров П.П.
Сидоров С.С.

Когда закончишь, отправь /done''', {'remove_keyboard': True, 'selective': False})
        save_user_state(user_id, 'waiting_people_list', state_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'waiting_people_list':
        if text == '/done':
            options = state_data.get('options', [])
            
            if len(options) < 2:
                send_telegram_message(chat_id, '❌ Нужно минимум 2 варианта. Продолжай добавлять людей или отправь /cancel')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
            
            template_id = create_template(
                user_id,
                state_data['template_name'],
                chat_id,
                state_data['question'],
                options
            )
            
            clear_user_state(user_id)
            send_telegram_message(
                chat_id,
                f"✅ Шаблон *{state_data['template_name']}* создан!\n\n📊 Сохранено {len(options)} человек",
                get_main_keyboard()
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        people = [line.strip() for line in text.split('\n') if line.strip()]
        current_options = state_data.get('options', [])
        current_options.extend(people)
        state_data['options'] = current_options
        
        send_telegram_message(chat_id, f"✅ Добавлено {len(people)} человек. Всего: {len(current_options)}\n\nПродолжай добавлять или отправь /done")
        save_user_state(user_id, 'waiting_people_list', state_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if text == '📋 Мои шаблоны':
        templates = get_user_templates(user_id)
        
        if not templates:
            send_telegram_message(chat_id, '📭 У тебя пока нет шаблонов. Создай первый!', get_main_keyboard())
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        template_list = '📋 *Твои шаблоны:*\n\n'
        for i, template in enumerate(templates, 1):
            template_list += f"{i}. *{template['template_name']}*\n"
            template_list += f"   Вопрос: {template['poll_question']}\n"
            template_list += f"   Людей: {len(template['poll_options'])}\n\n"
        
        send_telegram_message(chat_id, template_list, get_template_keyboard(templates))
        save_user_state(user_id, 'viewing_templates', {})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'viewing_templates' and text.startswith('📝 '):
        template_name = text.replace('📝 ', '').strip()
        template = get_template_by_name(user_id, template_name)
        
        if not template:
            send_telegram_message(chat_id, '❌ Шаблон не найден', get_main_keyboard())
            clear_user_state(user_id)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        options_text = '\n'.join([f"{i+1}. {opt}" for i, opt in enumerate(template['poll_options'])])
        
        detail_text = f'''📝 *Шаблон: {template['template_name']}*

❓ Вопрос: {template['poll_question']}

👥 Список людей ({len(template['poll_options'])}):
{options_text}

Что хочешь сделать?'''
        
        keyboard = {
            'keyboard': [
                [{'text': '✏️ Редактировать и отправить'}],
                [{'text': '📅 Запланировать отправку'}],
                [{'text': '🔙 Назад'}]
            ],
            'resize_keyboard': True
        }
        
        send_telegram_message(chat_id, detail_text, keyboard)
        save_user_state(user_id, 'template_selected', {'template_id': template['id'], 'template_name': template['template_name']})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'template_selected' and text == '✏️ Редактировать и отправить':
        template_id = state_data.get('template_id')
        templates = get_user_templates(user_id)
        template = next((t for t in templates if t['id'] == template_id), None)
        
        if not template:
            send_telegram_message(chat_id, '❌ Ошибка', get_main_keyboard())
            clear_user_state(user_id)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        options_text = '\n'.join([f"{i+1}. {opt}" for i, opt in enumerate(template['poll_options'])])
        
        edit_text = f'''✏️ *Редактирование списка*

Текущий список:
{options_text}

Чтобы изменить строку, напиши номер и новое значение:
*Пример:* 3 Новый Н.Н.

Чтобы отправить без изменений: /send'''
        
        send_telegram_message(chat_id, edit_text, {'remove_keyboard': True})
        save_user_state(user_id, 'editing_template', {
            'template_id': template_id,
            'question': template['poll_question'],
            'options': template['poll_options']
        })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'editing_template':
        if text == '/send':
            question = state_data['question']
            options = state_data['options']
            
            success = send_telegram_poll(chat_id, question, options)
            
            if success:
                send_telegram_message(chat_id, '✅ Опрос отправлен!', get_main_keyboard())
            else:
                send_telegram_message(chat_id, '❌ Ошибка отправки', get_main_keyboard())
            
            clear_user_state(user_id)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        parts = text.split(' ', 1)
        if len(parts) == 2 and parts[0].isdigit():
            index = int(parts[0]) - 1
            new_value = parts[1].strip()
            options = state_data['options']
            
            if 0 <= index < len(options):
                options[index] = new_value
                state_data['options'] = options
                save_user_state(user_id, 'editing_template', state_data)
                
                send_telegram_message(chat_id, f"✅ Изменено: {index+1}. {new_value}\n\nПродолжай редактировать или отправь /send")
            else:
                send_telegram_message(chat_id, f"❌ Неверный номер. Доступно 1-{len(options)}")
        else:
            send_telegram_message(chat_id, "❌ Неверный формат. Используй: *номер новое_значение*\nПример: 3 Новый Н.Н.")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'template_selected' and text == '📅 Запланировать отправку':
        schedule_text = '''📅 *Планирование отправки*

Введи дату и время в формате:
*ДД.ММ.ГГГГ ЧЧ:ММ*

Примеры:
• 15.12.2024 09:00 (утро)
• 15.12.2024 13:00 (обед)
• 15.12.2024 18:00 (вечер)'''
        
        send_telegram_message(chat_id, schedule_text, {'remove_keyboard': True})
        save_user_state(user_id, 'waiting_schedule_time', state_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if current_state == 'waiting_schedule_time':
        try:
            scheduled_time = datetime.strptime(text.strip(), '%d.%m.%Y %H:%M')
            
            if scheduled_time <= datetime.now():
                send_telegram_message(chat_id, '❌ Время должно быть в будущем!')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
            
            template_id = state_data.get('template_id')
            templates = get_user_templates(user_id)
            template = next((t for t in templates if t['id'] == template_id), None)
            
            if not template:
                send_telegram_message(chat_id, '❌ Ошибка', get_main_keyboard())
                clear_user_state(user_id)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
            
            poll_id = schedule_poll(
                template_id,
                user_id,
                chat_id,
                template['poll_question'],
                template['poll_options'],
                scheduled_time
            )
            
            clear_user_state(user_id)
            send_telegram_message(
                chat_id,
                f"✅ Опрос запланирован на {scheduled_time.strftime('%d.%m.%Y %H:%M')}!",
                get_main_keyboard()
            )
            
        except ValueError:
            send_telegram_message(chat_id, '❌ Неверный формат! Используй: ДД.ММ.ГГГГ ЧЧ:ММ\nПример: 15.12.2024 09:00')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if text == '🕐 Мои запланированные':
        polls = get_user_scheduled_polls(user_id)
        
        if not polls:
            send_telegram_message(chat_id, '📭 У тебя нет запланированных опросов', get_main_keyboard())
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        polls_text = '🕐 *Запланированные опросы:*\n\n'
        for i, poll in enumerate(polls, 1):
            status_emoji = '✅' if poll['status'] == 'sent' else '⏳'
            scheduled_time = poll['scheduled_time'].strftime('%d.%m.%Y %H:%M')
            polls_text += f"{i}. {status_emoji} {poll['poll_question'][:30]}...\n"
            polls_text += f"   Время: {scheduled_time}\n\n"
        
        send_telegram_message(chat_id, polls_text, get_main_keyboard())
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    send_telegram_message(chat_id, '❓ Не понимаю. Используй кнопки ниже:', get_main_keyboard())
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True})
    }