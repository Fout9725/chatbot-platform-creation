'''
Business: Telegram-бот для создания AI-фотосессий через Hugging Face Serverless API (бесплатно)
Args: event - dict with httpMethod (POST для webhook), body (JSON от Telegram)
      context - object with request_id, function_name, etc.
Returns: HTTP response dict с обработкой команд и генерацией изображений
'''

import json
import os
import requests
import psycopg2
from typing import Dict, Any, Optional
from dataclasses import dataclass

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
HUGGINGFACE_API = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'
DATABASE_URL = os.environ.get('DATABASE_URL', '')
ADMIN_IDS = [1508333931, 285675692]

def get_telegram_api() -> str:
    return f'https://api.telegram.org/bot{TELEGRAM_TOKEN}'

def get_db_connection():
    '''Подключение к PostgreSQL'''
    if not DATABASE_URL:
        print('DATABASE_URL not configured')
        return None
    return psycopg2.connect(DATABASE_URL)

def get_or_create_user(telegram_id: int, username: Optional[str], first_name: str) -> Optional[Dict]:
    '''Получение или создание пользователя в БД'''
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        
        # Проверяем, есть ли пользователь
        cur.execute(
            "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used FROM neurophoto_users WHERE telegram_id = %s",
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
                'total_used': result[5]
            }
            cur.close()
            conn.close()
            return user_data
        
        # Создаём нового пользователя
        cur.execute(
            "INSERT INTO neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s)",
            (telegram_id, username, first_name)
        )
        conn.commit()
        
        user_data = {
            'telegram_id': telegram_id,
            'username': username,
            'first_name': first_name,
            'free_generations': 15,
            'paid_generations': 0,
            'total_used': 0
        }
        
        cur.close()
        conn.close()
        return user_data
    except Exception as e:
        print(f'Database error in get_or_create_user: {e}')
        if conn:
            conn.close()
        return None

def use_generation(telegram_id: int) -> bool:
    '''Списание одной генерации у пользователя'''
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Получаем текущие значения
        cur.execute(
            "SELECT free_generations, paid_generations FROM neurophoto_users WHERE telegram_id = %s",
            (telegram_id,)
        )
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return False
        
        free_gen, paid_gen = result
        
        # Списываем генерацию (сначала бесплатные, потом платные)
        if free_gen > 0:
            cur.execute(
                "UPDATE neurophoto_users SET free_generations = free_generations - 1, total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
                (telegram_id,)
            )
        elif paid_gen > 0:
            cur.execute(
                "UPDATE neurophoto_users SET paid_generations = paid_generations - 1, total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
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

def get_all_stats() -> Optional[Dict]:
    '''Получение общей статистики по боту'''
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        
        # Общее количество пользователей
        cur.execute("SELECT COUNT(*) FROM neurophoto_users")
        total_users = cur.fetchone()[0]
        
        # Всего генераций
        cur.execute("SELECT SUM(total_used) FROM neurophoto_users")
        total_generations = cur.fetchone()[0] or 0
        
        # Активных пользователей (использовали хотя бы раз)
        cur.execute("SELECT COUNT(*) FROM neurophoto_users WHERE total_used > 0")
        active_users = cur.fetchone()[0]
        
        # Новые пользователи за сегодня
        cur.execute("SELECT COUNT(*) FROM neurophoto_users WHERE DATE(created_at) = CURRENT_DATE")
        new_today = cur.fetchone()[0]
        
        # Топ-5 активных пользователей
        cur.execute("""
            SELECT telegram_id, first_name, username, total_used 
            FROM neurophoto_users 
            ORDER BY total_used DESC 
            LIMIT 5
        """)
        top_users = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            'total_users': total_users,
            'total_generations': total_generations,
            'active_users': active_users,
            'new_today': new_today,
            'top_users': top_users
        }
    except Exception as e:
        print(f'Database error in get_all_stats: {e}')
        if conn:
            conn.close()
        return None

def add_generations(telegram_id: int, free_count: int = 0, paid_count: int = 0) -> bool:
    '''Добавление генераций пользователю'''
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        if free_count > 0:
            cur.execute(
                "UPDATE neurophoto_users SET free_generations = free_generations + %s WHERE telegram_id = %s",
                (free_count, telegram_id)
            )
        
        if paid_count > 0:
            cur.execute(
                "UPDATE neurophoto_users SET paid_generations = paid_generations + %s WHERE telegram_id = %s",
                (paid_count, telegram_id)
            )
        
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Database error in add_generations: {e}')
        if conn:
            conn.close()
        return False

def get_user_by_id(telegram_id: int) -> Optional[Dict]:
    '''Получение информации о пользователе по ID'''
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at FROM neurophoto_users WHERE telegram_id = %s",
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
                'created_at': result[6]
            }
            cur.close()
            conn.close()
            return user_data
        
        cur.close()
        conn.close()
        return None
    except Exception as e:
        print(f'Database error in get_user_by_id: {e}')
        if conn:
            conn.close()
        return None

def get_user_by_username(username: str) -> Optional[Dict]:
    '''Получение информации о пользователе по username'''
    conn = get_db_connection()
    if not conn:
        return None
    
    username_clean = username.lstrip('@').lower()
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at FROM neurophoto_users WHERE LOWER(username) = %s",
            (username_clean,)
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
                'created_at': result[6]
            }
            cur.close()
            conn.close()
            return user_data
        
        cur.close()
        conn.close()
        return None
    except Exception as e:
        print(f'Database error in get_user_by_username: {e}')
        if conn:
            conn.close()
        return None

def get_all_users(limit: int = 50, offset: int = 0) -> list:
    '''Получение списка всех пользователей с пагинацией'''
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at 
            FROM neurophoto_users 
            ORDER BY created_at DESC 
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        users = []
        for row in cur.fetchall():
            users.append({
                'telegram_id': row[0],
                'username': row[1],
                'first_name': row[2],
                'free_generations': row[3],
                'paid_generations': row[4],
                'total_used': row[5],
                'created_at': row[6]
            })
        
        cur.close()
        conn.close()
        return users
    except Exception as e:
        print(f'Database error in get_all_users: {e}')
        if conn:
            conn.close()
        return []

def search_users_by_name(search_query: str, limit: int = 20) -> list:
    '''Поиск пользователей по имени или username'''
    conn = get_db_connection()
    if not conn:
        return []
    
    search_pattern = f"%{search_query.lower()}%"
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT telegram_id, username, first_name, free_generations, paid_generations, total_used, created_at 
            FROM neurophoto_users 
            WHERE LOWER(first_name) LIKE %s OR LOWER(username) LIKE %s
            ORDER BY total_used DESC
            LIMIT %s
        """, (search_pattern, search_pattern, limit))
        
        users = []
        for row in cur.fetchall():
            users.append({
                'telegram_id': row[0],
                'username': row[1],
                'first_name': row[2],
                'free_generations': row[3],
                'paid_generations': row[4],
                'total_used': row[5],
                'created_at': row[6]
            })
        
        cur.close()
        conn.close()
        return users
    except Exception as e:
        print(f'Database error in search_users_by_name: {e}')
        if conn:
            conn.close()
        return []

def get_all_user_ids() -> list:
    '''Получение всех telegram_id для рассылки'''
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT telegram_id FROM neurophoto_users")
        ids = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        return ids
    except Exception as e:
        print(f'Database error in get_all_user_ids: {e}')
        if conn:
            conn.close()
        return []

def reset_user(telegram_id: int) -> bool:
    '''Сброс счетчика пользователя'''
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE neurophoto_users SET free_generations = 3, paid_generations = 0, total_used = 0 WHERE telegram_id = %s",
            (telegram_id,)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Database error in reset_user: {e}')
        if conn:
            conn.close()
        return False

@dataclass
class User:
    user_id: int
    username: Optional[str]
    first_name: str
    free_generations: int = 3

def send_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> None:
    '''Отправка сообщения в Telegram'''
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'MarkdownV2'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    try:
        response = requests.post(f'{get_telegram_api()}/sendMessage', json=data, timeout=10)
        print(f'sendMessage response: {response.status_code}, {response.text}')
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo(chat_id: int, photo_url: str, caption: str = '') -> None:
    '''Отправка фото в Telegram'''
    data = {
        'chat_id': chat_id,
        'photo': photo_url,
        'caption': caption,
        'parse_mode': 'MarkdownV2'
    }
    requests.post(f'{get_telegram_api()}/sendPhoto', json=data)

def send_chat_action(chat_id: int, action: str = 'upload_photo') -> None:
    '''Отправка статуса (печатает, загружает фото и т.д.)'''
    requests.post(f'{get_telegram_api()}/sendChatAction', json={
        'chat_id': chat_id,
        'action': action
    })

def generate_image(prompt: str, style: str = 'portrait') -> Optional[bytes]:
    '''Генерация изображения через OpenAI DALL-E 3'''
    style_prompts = {
        'portrait': 'professional portrait photo, studio lighting, high detail, photorealistic',
        'fashion': 'fashion photography, editorial style, vogue magazine, professional',
        'business': 'professional business portrait, corporate, confident, formal',
        'art': 'artistic portrait, dramatic lighting, cinematic, creative',
        'urban': 'urban street photography, city background, modern style',
        'nature': 'natural outdoor portrait, soft natural light, beautiful scenery',
        'concept': 'conceptual art portrait, creative, unique, artistic vision',
        'creative': 'creative photography, innovative style, artistic approach'
    }
    
    full_prompt = f"{prompt}, {style_prompts.get(style, style_prompts['portrait'])}"
    
    print(f'Generating image with OpenAI DALL-E 3: {full_prompt[:100]}...')
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'dall-e-3',
            'prompt': full_prompt,
            'n': 1,
            'size': '1024x1024',
            'quality': 'standard'
        }
        
        response = requests.post(
            'https://api.openai.com/v1/images/generations',
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f'OpenAI API response: {response.status_code}')
        
        if response.status_code == 200:
            result = response.json()
            image_url = result['data'][0]['url']
            
            print(f'Downloading generated image from: {image_url[:50]}...')
            img_response = requests.get(image_url, timeout=30)
            
            if img_response.status_code == 200:
                print(f'Image downloaded successfully, size: {len(img_response.content)} bytes')
                return img_response.content
        else:
            print(f'OpenAI API error: {response.status_code}, {response.text[:200]}')
        
        return None
    except Exception as e:
        print(f'OpenAI API error: {e}')
        return None

def send_photo_bytes(chat_id: int, image_bytes: bytes, caption: str = '') -> None:
    '''Отправка фото из байтов в Telegram'''
    try:
        url = f'{get_telegram_api()}/sendPhoto'
        files = {'photo': ('generated.png', image_bytes, 'image/png')}
        data = {
            'chat_id': chat_id,
            'caption': caption,
            'parse_mode': 'MarkdownV2'
        }
        response = requests.post(url, files=files, data=data, timeout=30)
        print(f'sendPhoto response: {response.status_code}')
    except Exception as e:
        print(f'Error sending photo bytes: {e}')

def get_start_keyboard(is_admin: bool = False) -> Dict:
    '''Клавиатура для главного меню'''
    keyboard = [
        [{'text': '🎨 Создать фото из текста', 'callback_data': 'generate_text'}],
        [{'text': '📸 Обработать мое фото', 'callback_data': 'process_photo'}],
        [{'text': '🎁 Мои бонусы', 'callback_data': 'bonuses'}],
        [{'text': '💎 Купить пакет фото', 'callback_data': 'buy_package'}],
        [{'text': '❓ Помощь', 'callback_data': 'help'}]
    ]
    
    if is_admin:
        keyboard.append([{'text': '⚙️ Админ-панель', 'callback_data': 'admin_panel'}])
    
    return {'inline_keyboard': keyboard}

def get_styles_keyboard() -> Dict:
    '''Клавиатура для выбора стиля'''
    return {
        'inline_keyboard': [
            [
                {'text': '📷 Портрет', 'callback_data': 'style_portrait'},
                {'text': '👗 Fashion', 'callback_data': 'style_fashion'}
            ],
            [
                {'text': '💼 Бизнес', 'callback_data': 'style_business'},
                {'text': '🎨 Арт', 'callback_data': 'style_art'}
            ],
            [
                {'text': '🌆 Городской', 'callback_data': 'style_urban'},
                {'text': '🌿 Природа', 'callback_data': 'style_nature'}
            ],
            [{'text': '⬅️ Назад', 'callback_data': 'back_menu'}]
        ]
    }

def handle_start(chat_id: int, first_name: str, username: Optional[str] = None) -> None:
    '''Обработка команды /start'''
    user_data = get_or_create_user(chat_id, username, first_name)
    is_admin = chat_id in ADMIN_IDS
    
    if user_data:
        free_gen = user_data['free_generations']
        paid_gen = user_data['paid_generations']
        total_gen = free_gen + paid_gen
        
        welcome_text = f'''👋 Привет, *{first_name}*\!

Я *Нейрофотосессия PRO* \- твой AI\-фотограф в Telegram\!

🎨 *Что я умею:*
\- Создаю фото из текстового описания
\- Обрабатываю твои фотографии  
\- Применяю 10\+ профессиональных стилей
\- Генерирую HD качество

💳 *Твой баланс:*
Доступно генераций: *{total_gen}*
Бесплатных: {free_gen} \| Купленных: {paid_gen}

Выбери действие ниже 👇'''
    else:
        welcome_text = f'''👋 Привет, *{first_name}*\!

Я *Нейрофотосессия PRO* \- твой AI\-фотограф в Telegram\!

🎨 *Что я умею:*
\- Создаю фото из текстового описания
\- Обрабатываю твои фотографии  
\- Применяю 10\+ профессиональных стилей
\- Генерирую HD качество

Выбери действие ниже 👇'''
    
    send_message(chat_id, welcome_text, get_start_keyboard(is_admin))

def handle_help(chat_id: int) -> None:
    '''Справка по использованию'''
    help_text = '''📖 *Как создать идеальное фото:*

*1\. Генерация из текста* 🎨
Опиши желаемое фото максимально подробно:
\- Кто на фото \(возраст, пол, внешность\)
\- Одежда и аксессуары
\- Поза и эмоции
\- Окружение и фон
\- Освещение

*Пример:*
"Портрет девушки 25 лет с длинными каштановыми волосами, в белой рубашке, улыбается, офисный фон, естественное освещение"

*2\. Стили фотосессий* 📷
\- *Портрет* \- классика, студия
\- *Fashion* \- модная съемка
\- *Бизнес* \- деловой стиль
\- *Арт* \- креативное фото
\- *Городской* \- уличная съемка
\- *Природа* \- натуральный свет

*3\. Пакеты* 💎
\- Мини \(5 фото\) \- 299₽
\- Стандарт \(10 фото\) \- 499₽
\- Профи \(20 фото\) \- 799₽

*Вопросы?* Пиши @support\_bot'''
    send_message(chat_id, help_text, get_start_keyboard())

def get_admin_keyboard() -> Dict:
    '''Клавиатура админ-панели'''
    return {
        'inline_keyboard': [
            [{'text': '📊 Статистика', 'callback_data': 'admin_stats'}],
            [{'text': '👥 База пользователей', 'callback_data': 'admin_users'}],
            [{'text': '🔍 Поиск пользователя', 'callback_data': 'admin_search'}],
            [{'text': '👤 Инфо о пользователе', 'callback_data': 'admin_userinfo'}],
            [{'text': '🎁 Начислить генерации', 'callback_data': 'admin_addgen'}],
            [{'text': '📢 Рассылка', 'callback_data': 'admin_broadcast'}],
            [{'text': '⚙️ Настройки бота', 'callback_data': 'admin_settings'}],
            [{'text': '⬅️ В главное меню', 'callback_data': 'back_menu'}]
        ]
    }

def handle_callback(chat_id: int, data: str, message_id: int, username: Optional[str] = None, first_name: str = 'Друг') -> None:
    '''Обработка нажатий на кнопки'''
    is_admin = chat_id in ADMIN_IDS
    
    if data == 'admin_panel' and is_admin:
        text = '''⚙️ *Админ-панель*

Добро пожаловать в панель управления ботом\!

Выбери нужное действие:'''
        send_message(chat_id, text, get_admin_keyboard())
        return
    
    elif data == 'admin_stats' and is_admin:
        stats = get_all_stats()
        if stats:
            top_users_text = '\n'.join([
                f"{i+1}\\. {user[1]} \\(@{user[2] or 'none'}\\) \\- {user[3]} генераций"
                for i, user in enumerate(stats['top_users'])
            ])
            
            stats_text = f'''📊 *Статистика бота*

👥 Всего пользователей: *{stats['total_users']}*
✅ Активных: *{stats['active_users']}*
🆕 Новых сегодня: *{stats['new_today']}*
🎨 Всего генераций: *{stats['total_generations']}*

🏆 *Топ\\-5 пользователей:*
{top_users_text}'''
            send_message(chat_id, stats_text, get_admin_keyboard())
        else:
            send_message(chat_id, '❌ Ошибка получения статистики', get_admin_keyboard())
        return
    
    elif data == 'admin_users' and is_admin:
        users = get_all_users(limit=20)
        if users:
            users_text = ''
            for i, user in enumerate(users, 1):
                username_display = f"@{user['username']}" if user['username'] else 'нет'
                reg_date = user['created_at'].strftime('%d.%m.%Y') if user['created_at'] else 'N/A'
                reg_date_escaped = reg_date.replace('.', '\\.')
                users_text += f"{i}\\. {user['first_name']} \\({username_display}\\)\\nID: `{user['telegram_id']}`\\nБ: {user['free_generations']} \\| П: {user['paid_generations']} \\| Использовано: {user['total_used']}\\nРег: {reg_date_escaped}\\n\\n"
            
            db_text = f'''👥 *База пользователей*

{users_text}Показано первых 20 пользователей\\.'''
            send_message(chat_id, db_text, get_admin_keyboard())
        else:
            send_message(chat_id, '❌ Пользователи не найдены', get_admin_keyboard())
        return
    
    elif data == 'admin_search' and is_admin:
        text = '''🔍 *Поиск пользователя*

Введи имя или username для поиска\\.

*Примеры:*
`Иван`
`john`
`@username`'''
        send_message(chat_id, text, get_admin_keyboard())
        user_states[chat_id] = 'waiting_search'
        return
    
    elif data == 'admin_userinfo' and is_admin:
        text = '''👤 *Информация о пользователе*

Отправь мне *username* \\(с @ или без\\) или *Telegram ID* пользователя\\.

*Примеры:*
`@username`
`username`
`123456789`'''
        send_message(chat_id, text, get_admin_keyboard())
        user_states[chat_id] = 'waiting_user_id'
        return
    
    elif data == 'admin_addgen' and is_admin:
        text = '''🎁 *Начисление генераций*

Отправь сообщение в формате:
`username количество тип`

*Примеры:*
`@username 10 paid` \\- начислить 10 платных
`username 5 free` \\- начислить 5 бесплатных
`123456789 10 paid` \\- начислить по ID'''
        send_message(chat_id, text, get_admin_keyboard())
        user_states[chat_id] = 'waiting_addgen'
        return
    
    elif data == 'admin_broadcast' and is_admin:
        text = '''📢 *Рассылка сообщений*

Отправь текст сообщения, которое нужно разослать всем пользователям бота\\.

⚠️ Используй эту функцию аккуратно\\!'''
        send_message(chat_id, text, get_admin_keyboard())
        user_states[chat_id] = 'waiting_broadcast'
        return
    
    elif data == 'admin_settings' and is_admin:
        text = '''⚙️ *Настройки бота*

*Текущие настройки:*
\- Бесплатных генераций: 15
\- Цена мини\\-пакета: 299₽
\- Цена стандарт: 499₽
\- Цена профи: 799₽

Для изменения настроек свяжись с разработчиком\\.'''
        send_message(chat_id, text, get_admin_keyboard())
        return
    
    elif data == 'generate_text':
        text = '''🎨 *Генерация фото из текста*

Опиши, какое фото ты хочешь создать\\.

*Пример хорошего описания:*
"Профессиональный портрет мужчины 30 лет в синем костюме, нейтральный серый фон, уверенный взгляд, студийное освещение"

*Напиши свой промпт:*'''
        send_message(chat_id, text, get_styles_keyboard())
    
    elif data == 'process_photo':
        text = '''📸 *Обработка твоего фото*

Загрузи свою фотографию, и я применю к ней профессиональные эффекты\!

*Доступные эффекты:*
\- Улучшение качества
\- Изменение стиля
\- Профессиональная ретушь
\- Художественные фильтры

Отправь фото 👇'''
        is_admin = chat_id in ADMIN_IDS
        send_message(chat_id, text, get_start_keyboard(is_admin))
    
    elif data == 'bonuses':
        user_data = get_or_create_user(chat_id, username, first_name)
        
        if user_data:
            free_gen = user_data['free_generations']
            paid_gen = user_data['paid_generations']
            total_used = user_data['total_used']
            
            text = f'''🎁 *Твои бонусы*

Бесплатных генераций: *{free_gen}*
Купленных генераций: *{paid_gen}*
Всего использовано: {total_used}

💡 После использования бесплатных генераций можно:
\- Купить пакет фото
\- Пригласить друзей \(\+2 за друга\)
\- Участвовать в конкурсах

Используй бонусы с умом\! 🎯'''
        else:
            text = '''🎁 *Твои бонусы*

Бесплатных генераций: *3*
Купленных генераций: *0*

💡 После использования бесплатных генераций можно:
\- Купить пакет фото
\- Пригласить друзей \(\+2 за друга\)
\- Участвовать в конкурсах

Используй бонусы с умом\! 🎯'''
        
        is_admin = chat_id in ADMIN_IDS
        send_message(chat_id, text, get_start_keyboard(is_admin))
    
    elif data == 'buy_package':
        text = '''💎 *Пакеты фотосессий*

*Мини* \- 299₽
\- 5 генераций
\- HD качество
\- Все стили

*Стандарт* \- 499₽ 🔥
\- 10 генераций
\- HD качество
\- Все стили
\- Приоритетная обработка

*Профи* \- 799₽ ⭐
\- 20 генераций
\- HD качество
\- Все стили
\- Приоритетная обработка
\- Эксклюзивные стили

Для покупки свяжись с @support\_bot'''
        is_admin = chat_id in ADMIN_IDS
        send_message(chat_id, text, get_start_keyboard(is_admin))
    
    elif data == 'help':
        handle_help(chat_id)
    
    elif data == 'back_menu':
        text = 'Выбери действие 👇'
        is_admin = chat_id in ADMIN_IDS
        send_message(chat_id, text, get_start_keyboard(is_admin))
    
    elif data.startswith('style_'):
        style = data.replace('style_', '')
        text = f'''✨ Выбран стиль: *{style.capitalize()}*

Теперь напиши описание желаемого фото\.
Я создам изображение в выбранном стиле\!

*Пример:*
"Портрет девушки 25 лет, длинные волосы, улыбка"'''
        send_message(chat_id, text)

user_states = {}

def handle_message(chat_id: int, text: str, first_name: str, username: Optional[str] = None) -> None:
    '''Обработка текстовых сообщений'''
    if text.startswith('/start'):
        handle_start(chat_id, first_name, username)
        return
    
    if text.startswith('/help'):
        handle_help(chat_id)
        return
    
    # Команда выхода из админ-панели
    if text.startswith('/logout'):
        if chat_id in ADMIN_IDS and chat_id in admin_authenticated:
            admin_authenticated.discard(chat_id)
            if chat_id in user_states:
                del user_states[chat_id]
            send_message(chat_id, '👋 Вышел из админ\\-панели\\. Для входа используй /admin')
        else:
            send_message(chat_id, '❌ Ты не авторизован в админ\\-панели')
        return
    
    # Секретная команда для входа в админ-панель
    if text.startswith('/admin'):
        if chat_id in ADMIN_IDS:
            if chat_id in admin_authenticated:
                text_msg = '''⚙️ *Админ-панель*

Добро пожаловать в панель управления ботом\!

Выбери нужное действие:'''
                send_message(chat_id, text_msg, get_admin_keyboard())
            else:
                send_message(chat_id, '🔐 Введи пароль для доступа к админ\\-панели:')
                user_states[chat_id] = 'waiting_admin_password'
        else:
            send_message(chat_id, '❌ У тебя нет доступа к этой команде')
        return
    
    # Проверка пароля админа
    if chat_id in ADMIN_IDS and chat_id in user_states and user_states.get(chat_id) == 'waiting_admin_password':
        if text.strip() == ADMIN_PASSWORD:
            admin_authenticated.add(chat_id)
            del user_states[chat_id]
            text_msg = '''✅ *Доступ разрешен\\!*

Добро пожаловать в панель управления ботом\!

Выбери нужное действие:'''
            send_message(chat_id, text_msg, get_admin_keyboard())
        else:
            send_message(chat_id, '❌ Неверный пароль\\. Попробуй еще раз или отмени командой /start')
        return
    
    # Обработка состояний админа
    if chat_id in ADMIN_IDS and chat_id in admin_authenticated and chat_id in user_states:
        state = user_states[chat_id]
        
        if state == 'waiting_search':
            search_query = text.strip()
            users = search_users_by_name(search_query)
            
            if users:
                users_text = ''
                for i, user in enumerate(users, 1):
                    username_display = f"@{user['username']}" if user['username'] else 'нет'
                    users_text += f"{i}\\. {user['first_name']} \\({username_display}\\)\\nID: `{user['telegram_id']}`\\nБ: {user['free_generations']} \\| П: {user['paid_generations']} \\| Использовано: {user['total_used']}\\n\\n"
                
                result_text = f'''🔍 *Результаты поиска по "{search_query}"*

{users_text}Найдено: {len(users)} пользователей\\.'''
                send_message(chat_id, result_text, get_admin_keyboard())
            else:
                send_message(chat_id, f'❌ Пользователи с именем "{search_query}" не найдены', get_admin_keyboard())
            
            del user_states[chat_id]
            return
        
        elif state == 'waiting_user_id':
            user_info = None
            search_text = text.strip()
            
            if search_text.startswith('@') or not search_text.isdigit():
                user_info = get_user_by_username(search_text)
            else:
                try:
                    target_id = int(search_text)
                    user_info = get_user_by_id(target_id)
                except ValueError:
                    pass
            
            if user_info:
                reg_date = user_info['created_at'].strftime('%d.%m.%Y') if user_info['created_at'] else 'N/A'
                reg_date_escaped = reg_date.replace('.', '\\.')
                username_display = f"@{user_info['username']}" if user_info['username'] else 'нет'
                
                info_text = f'''👤 *Информация о пользователе*

ID: `{user_info['telegram_id']}`
Имя: {user_info['first_name']}
Username: {username_display}
Бесплатных: {user_info['free_generations']}
Купленных: {user_info['paid_generations']}
Использовано: {user_info['total_used']}
Регистрация: {reg_date_escaped}'''
                send_message(chat_id, info_text, get_admin_keyboard())
            else:
                send_message(chat_id, '❌ Пользователь не найден', get_admin_keyboard())
            
            del user_states[chat_id]
            return
        
        elif state == 'waiting_addgen':
            try:
                parts = text.strip().split()
                if len(parts) >= 3:
                    user_identifier = parts[0]
                    count = int(parts[1])
                    gen_type = parts[2].lower()
                    
                    user_info = None
                    if user_identifier.startswith('@') or not user_identifier.isdigit():
                        user_info = get_user_by_username(user_identifier)
                    else:
                        target_id = int(user_identifier)
                        user_info = get_user_by_id(target_id)
                    
                    if not user_info:
                        send_message(chat_id, '❌ Пользователь не найден', get_admin_keyboard())
                        del user_states[chat_id]
                        return
                    
                    target_id = user_info['telegram_id']
                    
                    if gen_type == 'free':
                        success = add_generations(target_id, free_count=count)
                    elif gen_type == 'paid':
                        success = add_generations(target_id, paid_count=count)
                    else:
                        send_message(chat_id, '❌ Тип должен быть free или paid', get_admin_keyboard())
                        del user_states[chat_id]
                        return
                    
                    if success:
                        username_display = f"@{user_info['username']}" if user_info['username'] else user_info['first_name']
                        send_message(chat_id, f'✅ Добавлено {count} {gen_type} генераций пользователю {username_display}', get_admin_keyboard())
                        send_message(target_id, f'🎁 Администратор начислил тебе *{count}* генераций\\!')
                    else:
                        send_message(chat_id, '❌ Ошибка добавления генераций', get_admin_keyboard())
                else:
                    send_message(chat_id, '❌ Неверный формат\\. Попробуй еще раз:', get_admin_keyboard())
            except ValueError:
                send_message(chat_id, '❌ Неверный формат\\. Попробуй еще раз:', get_admin_keyboard())
            
            del user_states[chat_id]
            return
        
        elif state == 'waiting_broadcast':
            broadcast_text = text
            user_ids = get_all_user_ids()
            
            if user_ids:
                success_count = 0
                for user_id in user_ids:
                    try:
                        send_message(user_id, broadcast_text)
                        success_count += 1
                    except Exception as e:
                        print(f'Failed to send to {user_id}: {e}')
                
                send_message(chat_id, f'✅ Рассылка завершена\\! Отправлено: {success_count}/{len(user_ids)}', get_admin_keyboard())
            else:
                send_message(chat_id, '❌ Не удалось получить список пользователей', get_admin_keyboard())
            
            del user_states[chat_id]
            return
    
    # Админ-команды
    if chat_id in ADMIN_IDS:
        if text.startswith('/stats'):
            stats = get_all_stats()
            if stats:
                top_users_text = '\n'.join([
                    f"{i+1}\\. {user[1]} \\(@{user[2] or 'none'}\\) \\- {user[3]} генераций"
                    for i, user in enumerate(stats['top_users'])
                ])
                
                stats_text = f'''📊 *Статистика бота*

👥 Всего пользователей: *{stats['total_users']}*
✅ Активных: *{stats['active_users']}*
🆕 Новых сегодня: *{stats['new_today']}*
🎨 Всего генераций: *{stats['total_generations']}*

🏆 *Топ\\-5 пользователей:*
{top_users_text}'''
                send_message(chat_id, stats_text)
            else:
                send_message(chat_id, '❌ Ошибка получения статистики')
            return
        
        elif text.startswith('/addgen '):
            try:
                parts = text.split()
                if len(parts) >= 3:
                    target_id = int(parts[1])
                    count = int(parts[2])
                    gen_type = parts[3] if len(parts) > 3 else 'paid'
                    
                    if gen_type == 'free':
                        success = add_generations(target_id, free_count=count)
                    else:
                        success = add_generations(target_id, paid_count=count)
                    
                    if success:
                        send_message(chat_id, f'✅ Добавлено {count} генераций пользователю {target_id}')
                        send_message(target_id, f'🎁 Администратор начислил тебе *{count}* генераций\\!')
                    else:
                        send_message(chat_id, '❌ Ошибка добавления генераций')
                else:
                    send_message(chat_id, '❌ Использование: /addgen <telegram\\_id> <количество> <free/paid>')
            except ValueError:
                send_message(chat_id, '❌ Неверный формат\\. Использование: /addgen <telegram\\_id> <количество> <free/paid>')
            return
        
        elif text.startswith('/userinfo '):
            try:
                target_id = int(text.split()[1])
                user_info = get_user_by_id(target_id)
                
                if user_info:
                    reg_date = user_info['created_at'].strftime('%d.%m.%Y') if user_info['created_at'] else 'N/A'
                    reg_date_escaped = reg_date.replace('.', '\\.')
                    
                    info_text = f'''👤 *Информация о пользователе*

ID: `{user_info['telegram_id']}`
Имя: {user_info['first_name']}
Username: @{user_info['username'] or 'none'}
Бесплатных: {user_info['free_generations']}
Купленных: {user_info['paid_generations']}
Использовано: {user_info['total_used']}
Регистрация: {reg_date_escaped}'''
                    send_message(chat_id, info_text)
                else:
                    send_message(chat_id, '❌ Пользователь не найден')
            except (ValueError, IndexError):
                send_message(chat_id, '❌ Использование: /userinfo <telegram\\_id>')
            return
        
        elif text.startswith('/broadcast '):
            broadcast_text = text.replace('/broadcast ', '', 1)
            user_ids = get_all_user_ids()
            
            if user_ids:
                success_count = 0
                for user_id in user_ids:
                    try:
                        send_message(user_id, broadcast_text)
                        success_count += 1
                    except Exception as e:
                        print(f'Failed to send to {user_id}: {e}')
                
                send_message(chat_id, f'✅ Рассылка завершена\\. Отправлено: {success_count}/{len(user_ids)}')
            else:
                send_message(chat_id, '❌ Нет пользователей для рассылки')
            return
        
        elif text.startswith('/reset '):
            try:
                target_id = int(text.split()[1])
                if reset_user(target_id):
                    send_message(chat_id, f'✅ Счетчик пользователя {target_id} сброшен')
                    send_message(target_id, '🔄 Администратор сбросил твой счетчик\\. У тебя снова *3 бесплатные* генерации\\!')
                else:
                    send_message(chat_id, '❌ Ошибка сброса счетчика')
            except (ValueError, IndexError):
                send_message(chat_id, '❌ Использование: /reset <telegram\\_id>')
            return
        
        elif text == '/admin':
            admin_text = '''🛡️ *Админ\\-панель*

*Доступные команды:*

📊 /stats \\- общая статистика бота

👤 /userinfo <id> \\- информация о пользователе
_Пример: /userinfo 123456789_

🎁 /addgen <id> <число> <тип> \\- добавить генерации
_Пример: /addgen 123456789 10 paid_
_Тип: free или paid_

💬 /broadcast <текст> \\- отправить сообщение всем
_Пример: /broadcast Привет всем\\!_

🔄 /reset <id> \\- сбросить счетчик пользователя
_Пример: /reset 123456789_'''
            send_message(chat_id, admin_text)
            return
    
    # Получаем данные пользователя
    user_data = get_or_create_user(chat_id, username, first_name)
    
    if not user_data:
        send_message(chat_id, '❌ Ошибка подключения к базе данных\\. Попробуй позже\\.')
        return
    
    # Проверяем баланс
    free_gen = user_data['free_generations']
    paid_gen = user_data['paid_generations']
    total_gen = free_gen + paid_gen
    
    if total_gen <= 0:
        no_gen_text = '''❌ *У тебя закончились генерации\\!*

💎 Купи пакет фото для продолжения:
\- Мини \\(5 фото\\) \\- 299₽
\- Стандарт \\(10 фото\\) \\- 499₽
\- Профи \\(20 фото\\) \\- 799₽

Для покупки свяжись с @support\\_bot'''
        send_message(chat_id, no_gen_text, get_start_keyboard())
        return
    
    send_message(chat_id, '🎨 Генерирую твое фото\\.\\.\\. Это займет 20\\-40 секунд')
    send_chat_action(chat_id, 'upload_photo')
    
    image_bytes = generate_image(text, 'portrait')
    
    if image_bytes:
        # Списываем генерацию
        if use_generation(chat_id):
            remaining = total_gen - 1
            caption = f'✨ *Готово\\!*\n\nОсталось генераций: {remaining}'
            send_photo_bytes(chat_id, image_bytes, caption)
            send_message(chat_id, '🎉 Фото готово\\! Хочешь создать еще?', get_start_keyboard())
        else:
            send_message(chat_id, '❌ Ошибка списания генерации\\. Попробуй еще раз\\.')
    else:
        error_text = '''❌ Не удалось сгенерировать фото\\.

*Возможные причины:*
\\- Модель загружается \\(попробуй через минуту\\)
\\- API недоступен \\(попробуй позже\\)
\\- Промпт содержит запрещенный контент

Попробуй еще раз или купи пакет 💎'''
        send_message(chat_id, error_text, get_start_keyboard())

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
            'body': ''
        }
    
    print(f'Received request: method={method}')
    
    body_str = event.get('body', '{}')
    print(f'Event body: {body_str}')
    
    try:
        update = json.loads(body_str)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    print(f'TELEGRAM_TOKEN configured: {bool(TELEGRAM_TOKEN)}')
    
    if 'message' in update:
        message = update['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        first_name = message['from'].get('first_name', 'Friend')
        username = message['from'].get('username', None)
        
        handle_message(chat_id, text, first_name, username)
    
    elif 'callback_query' in update:
        callback = update['callback_query']
        chat_id = callback['message']['chat']['id']
        data = callback['data']
        message_id = callback['message']['message_id']
        first_name = callback['from'].get('first_name', 'Friend')
        username = callback['from'].get('username', None)
        
        handle_callback(chat_id, data, message_id, username, first_name)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'ok': True})
    }