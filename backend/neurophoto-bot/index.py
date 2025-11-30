'''
Business: Telegram-бот для создания AI-фотосессий через OpenRouter API с историей генераций
Args: event - dict with httpMethod (POST для webhook), body (JSON от Telegram)
      context - object with request_id, function_name, etc.
Returns: HTTP response dict с обработкой команд и генерацией изображений через OpenRouter
'''

import json
import os
import requests
import psycopg2
from typing import Dict, Any, Optional

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')
WORKER_URL = 'https://functions.poehali.dev/42b8079f-c20c-4eb9-b6ec-d45acfbe9c0f'
ADMIN_IDS = [1508333931, 285675692]

print(f'OPENROUTER_API_KEY configured: {bool(OPENROUTER_API_KEY)}, length: {len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0}')

IMAGE_MODELS = {
    'gemini-flash': {'id': 'google/gemini-2.0-flash-exp:free', 'name': '🆓 Gemini Flash', 'paid': False, 'time': '10-15 сек'},
    'gemini-3-pro': {'id': 'google/gemini-3-pro-image-preview', 'name': '🎨 Gemini 3 Pro', 'paid': True, 'time': '20-30 сек'},
    'gpt-5-image': {'id': 'openai/gpt-5-image', 'name': '🤖 GPT-5 Image', 'paid': True, 'time': '20-30 сек'},
    'gpt-5-mini': {'id': 'openai/gpt-5-image-mini', 'name': '⚡ GPT-5 Mini', 'paid': True, 'time': '15-25 сек'},
    'gemini-2.5-flash': {'id': 'google/gemini-2.5-flash-image', 'name': '🌟 Gemini 2.5 Flash', 'paid': True, 'time': '10-20 сек'}
}

IMAGE_EFFECTS = {
    'dramatic': {'name': '🎭 Драматический', 'prompt': 'dramatic lighting, high contrast, cinematic'},
    'vintage': {'name': '📷 Винтаж', 'prompt': 'vintage film photography, retro colors, grain texture'},
    'glamour': {'name': '✨ Гламур', 'prompt': 'glamour photography, soft focus, glowing skin'},
    'noir': {'name': '🎬 Нуар', 'prompt': 'film noir style, black and white, dramatic shadows'},
    'neon': {'name': '🌃 Неон', 'prompt': 'neon lights, cyberpunk aesthetic, vibrant colors'},
    'pastel': {'name': '🎨 Пастель', 'prompt': 'soft pastel colors, dreamy atmosphere, gentle tones'},
    'hdr': {'name': '📸 HDR', 'prompt': 'HDR photography, ultra detailed, enhanced colors'},
    'bokeh': {'name': '💫 Боке', 'prompt': 'beautiful bokeh background, depth of field, blurred lights'},
    'golden': {'name': '🌅 Золотой час', 'prompt': 'golden hour lighting, warm sunset tones, soft glow'},
    'moody': {'name': '🌙 Мрачный', 'prompt': 'moody atmosphere, dark tones, mysterious lighting'}
}

user_sessions = {}

def get_telegram_api() -> str:
    return f'https://api.telegram.org/bot{TELEGRAM_TOKEN}'

def get_db_connection():
    if not DATABASE_URL:
        print('DATABASE_URL not configured')
        return None
    return psycopg2.connect(DATABASE_URL)

def get_or_create_user(telegram_id: int, username: Optional[str], first_name: str) -> Optional[Dict]:
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, last_prompt FROM t_p60354232_chatbot_platform_cre.neurophoto_users WHERE telegram_id = %s",
            (telegram_id,)
        )
        result = cur.fetchone()
        
        if result:
            user_data = {
                'telegram_id': result[0],
                'username': result[1],
                'first_name': result[2],
                'free_generations': result[3],
                'paid_generations': result[4],
                'total_used': result[5],
                'last_prompt': result[6]
            }
            cur.close()
            conn.close()
            return user_data
        
        cur.execute(
            "INSERT INTO t_p60354232_chatbot_platform_cre.neurophoto_users (telegram_id, username, first_name, free_generations) VALUES (%s, %s, %s, 10)",
            (telegram_id, username, first_name)
        )
        conn.commit()
        
        user_data = {
            'telegram_id': telegram_id,
            'username': username,
            'first_name': first_name,
            'free_generations': 10,
            'paid_generations': 0,
            'total_used': 0,
            'last_prompt': None
        }
        
        cur.close()
        conn.close()
        return user_data
    except Exception as e:
        print(f'Database error in get_or_create_user: {e}')
        if conn:
            conn.close()
        return None

def use_generation(telegram_id: int, is_paid: bool = False) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT free_generations, paid_generations FROM t_p60354232_chatbot_platform_cre.neurophoto_users WHERE telegram_id = %s",
            (telegram_id,)
        )
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return False
        
        free_gen, paid_gen = result
        
        if is_paid:
            if paid_gen > 0:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET paid_generations = paid_generations - 1, total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
                    (telegram_id,)
                )
            else:
                cur.close()
                conn.close()
                return False
        else:
            if free_gen > 0:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET free_generations = free_generations - 1, total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
                    (telegram_id,)
                )
            else:
                cur.close()
                conn.close()
                return False
        
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Database error in use_generation: {e}')
        if conn:
            conn.close()
        return False

def save_generation_history(telegram_id: int, prompt: str, model: str, effect: Optional[str], image_url: str, is_paid: bool) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO t_p60354232_chatbot_platform_cre.neurophoto_generations (telegram_id, prompt, model, effect, image_url, is_paid) VALUES (%s, %s, %s, %s, %s, %s)",
            (telegram_id, prompt, model, effect, image_url, is_paid)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Database error in save_generation_history: {e}')
        if conn:
            conn.close()
        return False

def get_user_history(telegram_id: int, limit: int = 10) -> list:
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT prompt, model, effect, image_url, created_at FROM t_p60354232_chatbot_platform_cre.neurophoto_generations WHERE telegram_id = %s ORDER BY created_at DESC LIMIT %s",
            (telegram_id, limit)
        )
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        history = []
        for row in results:
            history.append({
                'prompt': row[0],
                'model': row[1],
                'effect': row[2],
                'image_url': row[3],
                'created_at': row[4]
            })
        return history
    except Exception as e:
        print(f'Database error in get_user_history: {e}')
        if conn:
            conn.close()
        return []

def send_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> None:
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    try:
        response = requests.post(f'{get_telegram_api()}/sendMessage', json=data, timeout=10)
        print(f'sendMessage response: {response.status_code}')
        if response.status_code != 200:
            print(f'sendMessage error: {response.text}')
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo_url(chat_id: int, image_url: str, caption: str = '', reply_markup: Optional[Dict] = None) -> None:
    try:
        data = {
            'chat_id': chat_id,
            'photo': image_url,
            'caption': caption
        }
        if reply_markup:
            data['reply_markup'] = json.dumps(reply_markup)
        
        response = requests.post(f'{get_telegram_api()}/sendPhoto', json=data, timeout=30)
        print(f'sendPhoto response: {response.status_code}')
    except Exception as e:
        print(f'Error sending photo URL: {e}')

def send_chat_action(chat_id: int, action: str = 'upload_photo') -> None:
    requests.post(f'{get_telegram_api()}/sendChatAction', json={
        'chat_id': chat_id,
        'action': action
    })

def trigger_worker() -> None:
    '''
    Запускает worker для обработки очереди
    '''
    try:
        requests.post(WORKER_URL, json={}, timeout=5)
        print('Worker triggered successfully')
    except Exception as e:
        print(f'Error triggering worker: {e}')

def add_to_queue(telegram_id: int, chat_id: int, username: Optional[str], first_name: str, prompt: str, model: str, is_paid: bool) -> Optional[int]:
    '''
    Добавляет задачу генерации в очередь
    '''
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO t_p60354232_chatbot_platform_cre.neurophoto_queue (telegram_id, chat_id, username, first_name, prompt, model, is_paid, status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending') RETURNING id",
            (telegram_id, chat_id, username, first_name, prompt, model, is_paid)
        )
        queue_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        print(f'Added to queue: {queue_id}, model: {model}, prompt: {prompt[:50]}...')
        
        trigger_worker()
        
        return queue_id
    except Exception as e:
        print(f'Error adding to queue: {e}')
        if conn:
            conn.close()
        return None

def generate_image(prompt: str, model: str = 'gemini-flash') -> Optional[str]:
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['gemini-flash'])
    model_id = model_info['id']
    
    print(f'Generating image with {model_info["name"]} ({model_id}): {prompt[:100]}...')
    
    if not OPENROUTER_API_KEY:
        print('OPENROUTER_API_KEY not configured')
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'NeurophotoBot'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'modalities': ['text', 'image']
        }
        
        timeout = 25 if not model_info['paid'] else 90
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=timeout
        )
        
        print(f'OpenRouter API response: {response.status_code}')
        print(f'OpenRouter response body: {response.text[:1000]}')
        
        if response.status_code == 200:
            data = response.json()
            
            # Проверяем поле images (base64 data URLs)
            if data.get('images') and len(data['images']) > 0:
                image_data = data['images'][0]
                print(f'Image generated successfully (base64): {image_data[:100]}...')
                return image_data
            
            # Проверяем choices[0].message для альтернативных форматов
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                # Проверяем поле images в message
                if message.get('images'):
                    image_data = message['images'][0]
                    print(f'Image generated successfully from message.images: {image_data[:100]}...')
                    return image_data
                
                # Проверяем content
                content = message.get('content', '')
                if isinstance(content, str) and content.startswith('data:image'):
                    print(f'Image generated successfully from content: {content[:100]}...')
                    return content
                
                print(f'No image in response. Message keys: {list(message.keys())}')
                print(f'Content type: {type(content)}, value: {str(content)[:500]}')
        else:
            print(f'OpenRouter API error: {response.status_code}, {response.text[:500]}')
        
        return None
    except Exception as e:
        print(f'OpenRouter API error: {e}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        return None

def get_tariff_keyboard() -> Dict:
    return {
        'inline_keyboard': [
            [{'text': '🆓 Бесплатный (10 генераций)', 'callback_data': 'tariff_free'}],
            [{'text': '💎 Платный (премиум модели)', 'callback_data': 'tariff_paid'}]
        ]
    }

def get_free_model_keyboard() -> Dict:
    return {
        'inline_keyboard': [
            [{'text': '🆓 Gemini Flash (генерировать)', 'callback_data': 'gen_gemini-flash'}]
        ]
    }

def get_paid_models_keyboard() -> Dict:
    buttons = []
    for key, model_info in IMAGE_MODELS.items():
        if model_info['paid']:
            buttons.append([{'text': f'{model_info["name"]} — {model_info["time"]}', 'callback_data': f'gen_{key}'}])
    return {'inline_keyboard': buttons}

def get_effects_keyboard() -> Dict:
    buttons = []
    effects_list = list(IMAGE_EFFECTS.items())
    
    for i in range(0, len(effects_list), 2):
        row = []
        for j in range(2):
            if i + j < len(effects_list):
                key, effect_info = effects_list[i + j]
                row.append({'text': effect_info['name'], 'callback_data': f'effect_{key}'})
        buttons.append(row)
    
    buttons.append([{'text': '✅ Оставить как есть', 'callback_data': 'effect_none'}])
    buttons.append([{'text': '🔄 Создать новое фото', 'callback_data': 'new_photo'}])
    buttons.append([{'text': '📜 Моя история', 'callback_data': 'show_history'}])
    
    return {'inline_keyboard': buttons}

def get_admin_keyboard() -> Dict:
    return {
        'inline_keyboard': [
            [{'text': '⚙️ Админ-панель', 'callback_data': 'admin_panel'}]
        ]
    }

def handle_start(chat_id: int, first_name: str, username: Optional[str] = None) -> None:
    user_data = get_or_create_user(chat_id, username, first_name)
    
    if user_data:
        free_gen = user_data['free_generations']
        paid_gen = user_data['paid_generations']
        
        welcome_text = f'''👋 Привет, {first_name}!

Я *Нейрофотосессия PRO* - твой AI-фотограф в Telegram!

💳 *Твой баланс:*
🆓 Бесплатных генераций: {free_gen}/10
💎 Платных генераций: {paid_gen}

📝 *Опиши, какую нейрофотографию ты хочешь создать?*

Например:
• Портрет девушки с длинными волосами на закате
• Бизнес-фото мужчины в костюме в офисе
• Креативное фото в стиле киберпанк'''
    else:
        welcome_text = f'''👋 Привет, {first_name}!

Я *Нейрофотосессия PRO* - твой AI-фотограф в Telegram!

🎁 *У тебя 10 бесплатных генераций!*

📝 *Опиши, какую нейрофотографию ты хочешь создать?*

Например:
• Портрет девушки с длинными волосами на закате
• Бизнес-фото мужчины в костюме в офисе
• Креативное фото в стиле киберпанк'''
    
    user_sessions[chat_id] = {'state': 'waiting_prompt'}
    
    keyboard = None
    if chat_id in ADMIN_IDS:
        keyboard = get_admin_keyboard()
    
    send_message(chat_id, welcome_text, keyboard)

def handle_callback(chat_id: int, data: str, first_name: str, username: Optional[str] = None) -> None:
    if data == 'tariff_free':
        text = '''🆓 *Бесплатный тариф*

Ты выбрал бесплатную генерацию.

Доступная модель:
• Gemini Flash - быстрая и качественная генерация

Нажми кнопку ниже для старта генерации 👇'''
        send_message(chat_id, text, get_free_model_keyboard())
        return
    
    elif data == 'tariff_paid':
        user_data = get_or_create_user(chat_id, username, first_name)
        if user_data and user_data['paid_generations'] > 0:
            text = '''💎 *Платный тариф*

Ты выбрал платную генерацию.

Доступные премиум модели:
• GPT-5 Mini - быстрая платная модель
• GPT-5 Premium - максимальное качество

Выбери модель для генерации 👇'''
            send_message(chat_id, text, get_paid_models_keyboard())
        else:
            text = '''❌ *У тебя нет платных генераций!*

Чтобы использовать премиум модели, купи пакет генераций.

Свяжись с @support_bot для покупки'''
            send_message(chat_id, text, get_tariff_keyboard())
        return
    
    elif data.startswith('gen_'):
        model_key = data.replace('gen_', '')
        
        user_data = get_or_create_user(chat_id, username, first_name)
        if not user_data:
            send_message(chat_id, '❌ Ошибка подключения к базе данных')
            return
        
        prompt = user_data.get('last_prompt', '')
        if not prompt:
            send_message(chat_id, '❌ Ошибка: промпт не найден. Начни заново с /start')
            return
        
        model_info = IMAGE_MODELS.get(model_key)
        if not model_info:
            send_message(chat_id, '❌ Неизвестная модель')
            return
        
        is_paid = model_info['paid']
        
        if is_paid and user_data['paid_generations'] <= 0:
            send_message(chat_id, '❌ У тебя нет платных генераций!')
            return
        
        if not is_paid and user_data['free_generations'] <= 0:
            send_message(chat_id, '❌ У тебя закончились бесплатные генерации!')
            return
        
        queue_id = add_to_queue(user_data['telegram_id'], chat_id, username, first_name, prompt, model_key, is_paid)
        if queue_id:
            if use_generation(chat_id, is_paid):
                send_message(chat_id, f'⏳ Задача #{queue_id} добавлена в очередь\n\n{model_info["name"]} — {model_info["time"]}\n\nИзображение придет автоматически когда будет готово. Можешь продолжать пользоваться ботом!')
            else:
                send_message(chat_id, '❌ Ошибка списания генерации')
        else:
            send_message(chat_id, '❌ Ошибка добавления в очередь')
        return
    
    elif data.startswith('effect_'):
        session = user_sessions.get(chat_id, {})
        original_prompt = session.get('prompt', '')
        model_key = session.get('model', 'gemini-flash')
        is_paid = session.get('is_paid', False)
        
        if data == 'effect_none':
            send_message(chat_id, '✅ Отлично! Фото сохранено без эффектов.', get_admin_keyboard() if chat_id in ADMIN_IDS else None)
            send_message(chat_id, '📝 Хочешь создать еще одно фото? Просто напиши новое описание!')
            user_sessions[chat_id] = {'state': 'waiting_prompt'}
            return
        
        effect_key = data.replace('effect_', '')
        effect_info = IMAGE_EFFECTS.get(effect_key)
        
        if not effect_info:
            send_message(chat_id, '❌ Неизвестный эффект')
            return
        
        enhanced_prompt = f"{original_prompt}, {effect_info['prompt']}"
        
        send_message(chat_id, f'🎨 Применяю эффект {effect_info["name"]}...')
        send_chat_action(chat_id, 'upload_photo')
        
        image_url = generate_image(enhanced_prompt, model_key)
        
        if image_url:
            save_generation_history(chat_id, enhanced_prompt, model_key, effect_key, image_url, is_paid)
            
            caption = f'''✨ Эффект применен!

Эффект: {effect_info["name"]}'''
            send_photo_url(chat_id, image_url, caption, get_effects_keyboard())
        else:
            send_message(chat_id, '❌ Не удалось применить эффект. Попробуй другой')
        return
    
    elif data == 'new_photo':
        text = '📝 Отлично! Опиши новую нейрофотографию, которую хочешь создать:'
        user_sessions[chat_id] = {'state': 'waiting_prompt'}
        send_message(chat_id, text, get_admin_keyboard() if chat_id in ADMIN_IDS else None)
        return
    
    elif data == 'show_history':
        history = get_user_history(chat_id, 5)
        
        if not history:
            send_message(chat_id, '📜 У тебя пока нет истории генераций')
            return
        
        history_text = '📜 *Твоя история (последние 5):*\n\n'
        for i, item in enumerate(history, 1):
            model_name = IMAGE_MODELS.get(item['model'], {}).get('name', 'Unknown')
            effect_name = IMAGE_EFFECTS.get(item['effect'], {}).get('name', 'Без эффекта') if item['effect'] else 'Без эффекта'
            prompt_short = item['prompt'][:50] + '...' if len(item['prompt']) > 50 else item['prompt']
            
            history_text += f"{i}. {prompt_short}\n"
            history_text += f"   Модель: {model_name}\n"
            history_text += f"   Эффект: {effect_name}\n\n"
        
        send_message(chat_id, history_text)
        return
    
    elif data == 'admin_panel' and chat_id in ADMIN_IDS:
        text = '''⚙️ *Админ-панель*

Доступные команды:
/stats - статистика бота
/addgen <id> <count> - добавить генерации
/userinfo <id> - инфо о пользователе'''
        send_message(chat_id, text)
        return

def handle_message(chat_id: int, text: str, first_name: str, username: Optional[str] = None) -> None:
    if text.startswith('/start'):
        handle_start(chat_id, first_name, username)
        return
    
    if text.startswith('/admin'):
        if chat_id not in ADMIN_IDS:
            send_message(chat_id, '❌ У тебя нет доступа к админ-панели')
            return
        
        conn = get_db_connection()
        if not conn:
            send_message(chat_id, '❌ Ошибка подключения к БД')
            return
        
        try:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM t_p60354232_chatbot_platform_cre.neurophoto_users")
            total_users = cur.fetchone()[0]
            
            cur.execute("SELECT SUM(total_used) FROM t_p60354232_chatbot_platform_cre.neurophoto_users")
            total_generations = cur.fetchone()[0] or 0
            
            cur.execute("SELECT SUM(free_generations) FROM t_p60354232_chatbot_platform_cre.neurophoto_users")
            total_free_remaining = cur.fetchone()[0] or 0
            
            cur.execute("SELECT SUM(paid_generations) FROM t_p60354232_chatbot_platform_cre.neurophoto_users")
            total_paid_remaining = cur.fetchone()[0] or 0
            
            cur.close()
            conn.close()
            
            admin_text = f'''⚙️ АДМИН-ПАНЕЛЬ

📊 Статистика:
👥 Всего пользователей: {total_users}
🎨 Всего генераций: {total_generations}
🆓 Бесплатных генераций осталось: {total_free_remaining}
💎 Платных генераций осталось: {total_paid_remaining}

💡 Команды:
/userinfo <@username или id> - информация о пользователе
/addgen <@username или id> <count> - добавить платные генерации
/addfree <@username или id> <count> - добавить бесплатные генерации
/broadcast <текст> - рассылка всем пользователям'''
            
            send_message(chat_id, admin_text)
        except Exception as e:
            send_message(chat_id, f'❌ Ошибка: {e}')
        return
    
    if text.startswith('/userinfo'):
        if chat_id not in ADMIN_IDS:
            send_message(chat_id, '❌ У тебя нет доступа к этой команде')
            return
        
        parts = text.split()
        if len(parts) < 2:
            send_message(chat_id, '❌ Использование: /userinfo <@username или telegram_id>')
            return
        
        try:
            user_identifier = parts[1]
            conn = get_db_connection()
            if not conn:
                send_message(chat_id, '❌ Ошибка подключения к БД')
                return
            
            cur = conn.cursor()
            
            # Проверяем, это username или telegram_id
            if user_identifier.startswith('@'):
                username = user_identifier[1:]  # Убираем @
                cur.execute(
                    "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at, last_generation_at FROM t_p60354232_chatbot_platform_cre.neurophoto_users WHERE username = %s",
                    (username,)
                )
                user_display = f'@{username}'
            else:
                user_id = int(user_identifier)
                cur.execute(
                    "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at, last_generation_at FROM t_p60354232_chatbot_platform_cre.neurophoto_users WHERE telegram_id = %s",
                    (user_id,)
                )
                user_display = user_id
            
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if not result:
                send_message(chat_id, f'❌ Пользователь {user_display} не найден')
                return
            
            user_text = f'''👤 Информация о пользователе

🆔 Telegram ID: {result[0]}
👤 Username: @{result[1] or "нет"}
📝 Имя: {result[2]}
🆓 Бесплатных: {result[3]}
💎 Платных: {result[4]}
📊 Всего использовано: {result[5]}
📅 Регистрация: {result[6].strftime('%d.%m.%Y %H:%M')}
🕐 Последняя генерация: {result[7].strftime('%d.%m.%Y %H:%M') if result[7] else 'никогда'}'''
            
            send_message(chat_id, user_text)
        except ValueError:
            send_message(chat_id, '❌ Неверный формат данных')
        except Exception as e:
            send_message(chat_id, f'❌ Ошибка: {e}')
        return
    
    if text.startswith('/addgen'):
        if chat_id not in ADMIN_IDS:
            send_message(chat_id, '❌ У тебя нет доступа к этой команде')
            return
        
        parts = text.split()
        if len(parts) < 3:
            send_message(chat_id, '❌ Использование: /addgen <@username или telegram_id> <count>')
            return
        
        try:
            user_identifier = parts[1]
            count = int(parts[2])
            
            conn = get_db_connection()
            if not conn:
                send_message(chat_id, '❌ Ошибка подключения к БД')
                return
            
            cur = conn.cursor()
            
            # Проверяем, это username или telegram_id
            if user_identifier.startswith('@'):
                username = user_identifier[1:]  # Убираем @
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET paid_generations = paid_generations + %s WHERE username = %s",
                    (count, username)
                )
                user_display = f'@{username}'
            else:
                user_id = int(user_identifier)
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET paid_generations = paid_generations + %s WHERE telegram_id = %s",
                    (count, user_id)
                )
                user_display = user_id
            
            conn.commit()
            
            if cur.rowcount > 0:
                send_message(chat_id, f'✅ Пользователю {user_display} добавлено {count} платных генераций')
            else:
                send_message(chat_id, f'❌ Пользователь {user_display} не найден')
            
            cur.close()
            conn.close()
        except ValueError:
            send_message(chat_id, '❌ Неверный формат данных')
        except Exception as e:
            send_message(chat_id, f'❌ Ошибка: {e}')
        return
    
    if text.startswith('/addfree'):
        if chat_id not in ADMIN_IDS:
            send_message(chat_id, '❌ У тебя нет доступа к этой команде')
            return
        
        parts = text.split()
        if len(parts) < 3:
            send_message(chat_id, '❌ Использование: /addfree <@username или telegram_id> <count>')
            return
        
        try:
            user_identifier = parts[1]
            count = int(parts[2])
            
            conn = get_db_connection()
            if not conn:
                send_message(chat_id, '❌ Ошибка подключения к БД')
                return
            
            cur = conn.cursor()
            
            # Проверяем, это username или telegram_id
            if user_identifier.startswith('@'):
                username = user_identifier[1:]  # Убираем @
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET free_generations = free_generations + %s WHERE username = %s",
                    (count, username)
                )
                user_display = f'@{username}'
            else:
                user_id = int(user_identifier)
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET free_generations = free_generations + %s WHERE telegram_id = %s",
                    (count, user_id)
                )
                user_display = user_id
            
            conn.commit()
            
            if cur.rowcount > 0:
                send_message(chat_id, f'✅ Пользователю {user_display} добавлено {count} бесплатных генераций')
            else:
                send_message(chat_id, f'❌ Пользователь {user_display} не найден')
            
            cur.close()
            conn.close()
        except ValueError:
            send_message(chat_id, '❌ Неверный формат данных')
        except Exception as e:
            send_message(chat_id, f'❌ Ошибка: {e}')
        return
    
    if text.startswith('/history'):
        history = get_user_history(chat_id, 10)
        
        if not history:
            send_message(chat_id, '📜 У тебя пока нет истории генераций')
            return
        
        history_text = '📜 *Твоя история (последние 10):*\n\n'
        for i, item in enumerate(history, 1):
            model_name = IMAGE_MODELS.get(item['model'], {}).get('name', 'Unknown')
            effect_name = IMAGE_EFFECTS.get(item['effect'], {}).get('name', 'Без эффекта') if item['effect'] else 'Без эффекта'
            prompt_short = item['prompt'][:50] + '...' if len(item['prompt']) > 50 else item['prompt']
            
            history_text += f"{i}. {prompt_short}\n"
            history_text += f"   Модель: {model_name}\n"
            history_text += f"   Эффект: {effect_name}\n"
            history_text += f"   Дата: {item['created_at'].strftime('%d.%m.%Y %H:%M')}\n\n"
        
        send_message(chat_id, history_text)
        return
    
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_users SET last_prompt = %s WHERE telegram_id = %s",
                (text, chat_id)
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            print(f'Error saving prompt: {e}')
            if conn:
                conn.close()
    
    user_data = get_or_create_user(chat_id, username, first_name)
    if not user_data:
        send_message(chat_id, '❌ Ошибка подключения к базе данных')
        return
    
    if user_data['free_generations'] <= 0:
        send_message(chat_id, '❌ У тебя закончились бесплатные генерации!')
        return
    
    tariff_text = f'✅ Отлично!\n\nТвой запрос: {text[:100]}\n\nТеперь выбери тариф для генерации:'
    send_message(chat_id, tariff_text, get_tariff_keyboard())

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'message' in body:
            message = body['message']
            chat_id = message['chat']['id']
            first_name = message['from'].get('first_name', 'Друг')
            username = message['from'].get('username')
            text = message.get('text', '')
            
            handle_message(chat_id, text, first_name, username)
        
        elif 'callback_query' in body:
            callback_query = body['callback_query']
            chat_id = callback_query['message']['chat']['id']
            first_name = callback_query['from'].get('first_name', 'Друг')
            username = callback_query['from'].get('username')
            data = callback_query['data']
            
            handle_callback(chat_id, data, first_name, username)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error in handler: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }