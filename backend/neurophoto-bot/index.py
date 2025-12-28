import json
import os
from typing import Dict, Any, Optional, List
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

ADMIN_IDS = [285675692]  # Список ID администраторов

IMAGE_MODELS = {
    'free': [
        {'id': 'google/gemini-2.5-flash-image-preview:free', 'name': 'Gemini 2.5 Flash (Free)', 'emoji': '⚡'},
    ],
    'paid': [
        {'id': 'openai/dall-e-3', 'name': 'DALL-E 3', 'emoji': '🎨'},
        {'id': 'black-forest-labs/flux-pro', 'name': 'FLUX Pro', 'emoji': '🌟'},
        {'id': 'black-forest-labs/flux-1.1-pro', 'name': 'FLUX 1.1 Pro', 'emoji': '✨'},
        {'id': 'black-forest-labs/flux-2-pro', 'name': 'FLUX 2 Pro', 'emoji': '💫'},
        {'id': 'google/gemini-2.5-flash-image', 'name': 'Gemini 2.5 Flash', 'emoji': '⚡'},
        {'id': 'google/gemini-3-pro-image-preview', 'name': 'Gemini 3 Pro', 'emoji': '💎'},
        {'id': 'google/gemini-2.5-preview', 'name': 'Gemini 2.5 Preview', 'emoji': '🔮'},
        {'id': 'stability-ai/stable-diffusion-xl', 'name': 'Stable Diffusion XL', 'emoji': '🎭'},
        {'id': 'midjourney/imagine', 'name': 'Midjourney Imagine', 'emoji': '🖼️'},
    ]
}

def is_admin(telegram_id: int) -> bool:
    '''Проверка является ли пользователь администратором'''
    return telegram_id in ADMIN_IDS

def send_telegram_message(bot_token: str, chat_id: str, text: str, reply_markup: Optional[dict] = None) -> bool:
    '''Отправка текстового сообщения в Telegram'''
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        payload['reply_markup'] = reply_markup
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"[ERROR] Send message: {e}")
        return False

def send_telegram_photo(bot_token: str, chat_id: str, photo_url: str, caption: str = '', reply_markup: Optional[dict] = None) -> bool:
    '''Отправка изображения в Telegram'''
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
    payload = {
        'chat_id': chat_id,
        'photo': photo_url,
        'caption': caption,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        payload['reply_markup'] = reply_markup
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"[ERROR] Send photo: {e}")
        return False

def generate_image_openrouter(prompt: str, model: str) -> Optional[str]:
    '''Генерация изображения через OpenRouter API'''
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        print("[ERROR] No OPENROUTER_API_KEY")
        return None
    
    url = 'https://openrouter.ai/api/v1/chat/completions'
    
    data = json.dumps({
        'model': model,
        'messages': [{
            'role': 'user',
            'content': [{'type': 'text', 'text': prompt}]
        }],
        'max_tokens': 1000
    }).encode('utf-8')
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://poehali.dev',
        'X-Title': 'Neurophoto Bot'
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            if 'https://' in content:
                start = content.find('https://')
                end = content.find(')', start)
                if end == -1:
                    end = content.find(' ', start)
                if end == -1:
                    end = len(content)
                image_url = content[start:end].strip()
                return image_url
            
            print(f"[ERROR] No image URL in response: {content[:200]}")
            return None
    except Exception as e:
        print(f"[ERROR] Generate image: {e}")
        return None

def upload_to_s3(image_url: str, telegram_id: int) -> Optional[str]:
    '''Загрузка изображения в S3 для постоянного хранения'''
    try:
        req = urllib.request.Request(image_url)
        with urllib.request.urlopen(req, timeout=30) as response:
            image_data = response.read()
        
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        key = f'neurophoto/{telegram_id}/{os.urandom(8).hex()}.png'
        s3.put_object(Bucket='files', Key=key, Body=image_data, ContentType='image/png')
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return cdn_url
    except Exception as e:
        print(f"[ERROR] Upload to S3: {e}")
        return None

def get_model_keyboard(tier: str):
    '''Генерация клавиатуры выбора модели по тарифу'''
    buttons = []
    
    if tier == 'free':
        for model in IMAGE_MODELS['free']:
            buttons.append([{'text': f"{model['emoji']} {model['name']}", 'callback_data': f"model:{model['id']}"}])
    else:
        for model in IMAGE_MODELS['paid']:
            buttons.append([{'text': f"{model['emoji']} {model['name']}", 'callback_data': f"model:{model['id']}"}])
    
    buttons.append([{'text': '↩️ Назад', 'callback_data': 'back'}])
    return {'inline_keyboard': buttons}

def get_tier_keyboard():
    '''Клавиатура выбора тарифа'''
    return {
        'inline_keyboard': [
            [{'text': '🆓 Бесплатная модель', 'callback_data': 'tier:free'}],
            [{'text': '💎 Pro модели', 'callback_data': 'tier:paid'}],
            [{'text': '↩️ Назад', 'callback_data': 'back'}]
        ]
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Telegram бот для генерации AI-изображений (Нейрофотосессия)'''
    method: str = event.get('httpMethod', 'POST')
    
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
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'ok': True})
        }
    
    try:
        body_str = event.get('body', '{}')
        print(f"[WEBHOOK] Received: {body_str[:200]}")
        
        update = json.loads(body_str)
        bot_token = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
        db_url = os.environ.get('DATABASE_URL')
        
        if not db_url:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Обработка callback кнопок
        if 'callback_query' in update:
            callback = update['callback_query']
            chat_id = str(callback['message']['chat']['id'])
            telegram_id = callback['from']['id']
            data = callback['data']
            
            if data == 'tier:free':
                send_telegram_message(bot_token, chat_id, '🆓 <b>Бесплатные модели:</b>\n\nВыберите модель:', get_model_keyboard('free'))
            
            elif data == 'tier:paid':
                cur.execute("SELECT paid_generations FROM neurophoto_users WHERE telegram_id = %s", (telegram_id,))
                user = cur.fetchone()
                is_paid = user and user['paid_generations'] > 0 if user else False
                
                if not is_paid:
                    send_telegram_message(bot_token, chat_id, 
                        '💎 <b>Pro модели доступны только по подписке</b>\n\n'
                        '<b>Нейрофотосессия PRO - 299₽/мес</b>\n\n'
                        '✅ Все Pro модели (DALL-E 3, FLUX, Gemini Pro)\n'
                        '✅ Неограниченные генерации\n'
                        '✅ Приоритетная обработка\n\n'
                        'Для оплаты напишите: /pay'
                    )
                else:
                    send_telegram_message(bot_token, chat_id, '💎 <b>Pro модели:</b>\n\nВыберите модель:', get_model_keyboard('paid'))
            
            elif data.startswith('model:'):
                model_id = data.split(':', 1)[1]
                cur.execute("UPDATE neurophoto_users SET preferred_model = %s WHERE telegram_id = %s", (model_id, telegram_id))
                conn.commit()
                
                all_models = IMAGE_MODELS['free'] + IMAGE_MODELS['paid']
                model_name = next((m['name'] for m in all_models if m['id'] == model_id), 'Unknown')
                send_telegram_message(bot_token, chat_id, f"✅ Модель изменена на: {model_name}\n\nТеперь просто отправьте описание изображения!")
            
            elif data == 'back':
                send_telegram_message(bot_token, chat_id, 'Главное меню. Напишите /help для справки.')
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if 'message' not in update:
            print("[WEBHOOK] No message in update")
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        message = update['message']
        chat_id = str(message['chat']['id'])
        telegram_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', '')
        message_text = message.get('text', '')
        
        print(f"[MESSAGE] From {username} ({telegram_id}): {message_text}")
        
        # Команда /admin - статистика для админов
        if message_text == '/admin' and is_admin(telegram_id):
            cur.execute("SELECT COUNT(*) as total_users FROM neurophoto_users")
            total_users = cur.fetchone()['total_users']
            
            cur.execute("SELECT COUNT(*) as paid_users FROM neurophoto_users WHERE paid_generations > 0")
            paid_users = cur.fetchone()['paid_users']
            
            cur.execute("SELECT SUM(total_used) as total_gens FROM neurophoto_users")
            total_gens = cur.fetchone()['total_gens'] or 0
            
            cur.execute("SELECT COUNT(*) as today_gens FROM neurophoto_generations WHERE created_at > NOW() - INTERVAL '1 day'")
            today_gens = cur.fetchone()['today_gens']
            
            admin_text = (
                '👑 <b>Админ-панель Нейрофотосессия</b>\n\n'
                f'👥 Всего пользователей: {total_users}\n'
                f'💎 Платных подписчиков: {paid_users}\n'
                f'🎨 Всего генераций: {total_gens}\n'
                f'📊 Генераций сегодня: {today_gens}\n\n'
                '<b>Доступные команды:</b>\n'
                '/admin - эта панель\n'
                '/users - список пользователей\n'
                '/topusers - топ по генерациям\n'
                '/addpro [@login] - выдать Pro по логину\n'
                '/addgens [@login] [кол-во] - добавить генерации\n'
                '/addpaidgens [@login] [кол-во] - добавить платные генерации\n'
                '/userinfo [@login] - инфо о пользователе\n'
                '/broadcast [текст] - рассылка всем'
            )
            send_telegram_message(bot_token, chat_id, admin_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /users - список последних пользователей
        if message_text == '/users' and is_admin(telegram_id):
            cur.execute("SELECT telegram_id, username, first_name, total_used, free_generations, paid_generations FROM neurophoto_users ORDER BY created_at DESC LIMIT 20")
            users = cur.fetchall()
            
            users_text = '👥 <b>Последние 20 пользователей:</b>\n\n'
            for user in users:
                status = '💎 Pro' if user['paid_generations'] > 0 else f"🆓 {user['free_generations']}"
                users_text += f"{user['telegram_id']} (@{user['username'] or 'noname'}) - {user['total_used']} ген. - {status}\n"
            
            send_telegram_message(bot_token, chat_id, users_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /topusers - топ пользователей
        if message_text == '/topusers' and is_admin(telegram_id):
            cur.execute("SELECT telegram_id, username, total_used, paid_generations FROM neurophoto_users ORDER BY total_used DESC LIMIT 15")
            users = cur.fetchall()
            
            top_text = '🏆 <b>Топ-15 пользователей:</b>\n\n'
            for i, user in enumerate(users, 1):
                status = '💎' if user['paid_generations'] > 0 else '🆓'
                top_text += f"{i}. {status} @{user['username'] or user['telegram_id']} - {user['total_used']} генераций\n"
            
            send_telegram_message(bot_token, chat_id, top_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /addpro [@login] - выдать Pro подписку
        if message_text.startswith('/addpro ') and is_admin(telegram_id):
            try:
                user_input = message_text.split()[1].lstrip('@')
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute("UPDATE neurophoto_users SET paid_generations = 999999 WHERE telegram_id = %s RETURNING telegram_id, username", (user_id,))
                except ValueError:
                    cur.execute("UPDATE neurophoto_users SET paid_generations = 999999 WHERE username = %s RETURNING telegram_id, username", (user_input,))
                
                result = cur.fetchone()
                if result:
                    conn.commit()
                    send_telegram_message(bot_token, chat_id, f'✅ Pro подписка выдана пользователю @{result["username"] or result["telegram_id"]}')
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Пользователь не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}\n\nФормат: /addpro [@login или ID]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /addgens [@login] [количество] - добавить бесплатные генерации
        if message_text.startswith('/addgens ') and is_admin(telegram_id):
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute("UPDATE neurophoto_users SET free_generations = free_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute("UPDATE neurophoto_users SET free_generations = free_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                
                result = cur.fetchone()
                if result:
                    conn.commit()
                    send_telegram_message(bot_token, chat_id, f'✅ Добавлено {amount} бесплатных генераций пользователю @{result["username"] or result["telegram_id"]}')
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Пользователь не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}\n\nФормат: /addgens [@login или ID] [количество]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /addpaidgens [@login] [количество] - добавить платные генерации
        if message_text.startswith('/addpaidgens ') and is_admin(telegram_id):
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute("UPDATE neurophoto_users SET paid_generations = paid_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute("UPDATE neurophoto_users SET paid_generations = paid_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                
                result = cur.fetchone()
                if result:
                    conn.commit()
                    send_telegram_message(bot_token, chat_id, f'✅ Добавлено {amount} платных генераций пользователю @{result["username"] or result["telegram_id"]}')
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Пользователь не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}\n\nФормат: /addpaidgens [@login или ID] [количество]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /userinfo [@login] - информация о пользователе
        if message_text.startswith('/userinfo ') and is_admin(telegram_id):
            try:
                user_input = message_text.split()[1].lstrip('@')
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute("SELECT * FROM neurophoto_users WHERE telegram_id = %s", (user_id,))
                except ValueError:
                    cur.execute("SELECT * FROM neurophoto_users WHERE username = %s", (user_input,))
                
                user = cur.fetchone()
                if user:
                    cur.execute("SELECT COUNT(*) as gens_count FROM neurophoto_generations WHERE telegram_id = %s", (user['telegram_id'],))
                    gens = cur.fetchone()['gens_count']
                    
                    status = '💎 PRO' if user['paid_generations'] > 0 else '🆓 Free'
                    info_text = (
                        f'👤 <b>Информация о пользователе</b>\n\n'
                        f'ID: {user["telegram_id"]}\n'
                        f'Логин: @{user["username"] or "нет"}\n'
                        f'Имя: {user["first_name"] or "не указано"}\n'
                        f'Статус: {status}\n\n'
                        f'🆓 Бесплатных генераций: {user["free_generations"]}\n'
                        f'💎 Платных генераций: {user["paid_generations"]}\n'
                        f'📊 Всего использовано: {user["total_used"]}\n'
                        f'🗄️ Записей в БД: {gens}\n\n'
                        f'🎨 Модель: {user.get("preferred_model", "не выбрана")[:50]}...\n'
                        f'📅 Регистрация: {user["created_at"]}'
                    )
                    send_telegram_message(bot_token, chat_id, info_text)
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Пользователь не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}\n\nФормат: /userinfo [@login или ID]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Обычные команды
        if message_text in ['/start', '/help']:
            help_text = (
                '🎨 <b>Нейрофотосессия PRO</b>\n\n'
                'Создавайте профессиональные AI-фотографии!\n\n'
                '<b>Команды:</b>\n'
                '/models - Выбрать модель генерации\n'
                '/stats - Ваша статистика\n'
                '/help - Эта справка\n\n'
                '<b>Как пользоваться:</b>\n'
                '1. Выберите модель командой /models\n'
                '2. Опишите изображение текстом\n'
                '3. Получите фото за 10-60 секунд\n\n'
                '<b>Примеры:</b>\n'
                '• Портрет девушки с голубыми глазами\n'
                '• Закат над океаном в стиле импрессионизм\n'
                '• Современный офис с панорамными окнами\n\n'
                '<b>Тарифы:</b>\n'
                '🆓 Бесплатно: 10 изображений\n'
                '💎 PRO: 299₽/мес - безлимит + все модели'
            )
            send_telegram_message(bot_token, chat_id, help_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if message_text == '/models':
            send_telegram_message(bot_token, chat_id, '📱 <b>Выберите тариф:</b>', get_tier_keyboard())
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if message_text == '/stats':
            cur.execute("SELECT free_generations, paid_generations, total_used, preferred_model FROM neurophoto_users WHERE telegram_id = %s", (telegram_id,))
            user = cur.fetchone()
            
            if user:
                is_paid = user['paid_generations'] > 0
                all_models = IMAGE_MODELS['free'] + IMAGE_MODELS['paid']
                model_name = next((m['name'] for m in all_models if m['id'] == user.get('preferred_model', '')), 'Gemini 2.5 Flash (Free)')
                
                stats_text = (
                    f'📊 <b>Ваша статистика</b>\n\n'
                    f'🎨 Текущая модель: {model_name}\n'
                    f'📈 Всего сгенерировано: {user["total_used"]}\n'
                    f'🆓 Бесплатных осталось: {user["free_generations"]}\n'
                )
                if is_paid:
                    stats_text += f'💎 Pro доступ: активен (безлимит)\n'
                else:
                    stats_text += '\n💡 Хотите безлимит? Напишите /pay'
            else:
                stats_text = '❌ Пользователь не найден. Напишите /start'
            
            send_telegram_message(bot_token, chat_id, stats_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Проверка на неизвестные команды и админские команды без прав
        if message_text.startswith('/'):
            admin_commands = ['/admin', '/users', '/topusers', '/addpro', '/addgens', '/addpaidgens', '/userinfo', '/broadcast']
            
            # Если это админская команда, но пользователь не админ
            if any(message_text.startswith(cmd) for cmd in admin_commands) and not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.\n\nИспользуйте /help для списка доступных команд.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            # Неизвестная команда
            send_telegram_message(bot_token, chat_id, '❓ Неизвестная команда.\n\nИспользуйте /help для списка доступных команд.')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Генерация изображения
        cur.execute(
            "INSERT INTO neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
            "ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name "
            "RETURNING free_generations, paid_generations, total_used, preferred_model",
            (telegram_id, username, first_name)
        )
        user_data = cur.fetchone()
        conn.commit()
        
        free_left = max(0, user_data['free_generations'])
        is_paid = user_data['paid_generations'] > 0
        preferred_model = user_data.get('preferred_model') or 'google/gemini-2.5-flash-image-preview:free'
        
        print(f"[USER] Free: {free_left}, Paid: {is_paid}, Model: {preferred_model}")
        
        # Проверка лимитов
        if not is_paid and free_left <= 0:
            limit_text = (
                '❌ <b>Бесплатный лимит исчерпан</b>\n\n'
                'Вы использовали все 10 бесплатных генераций.\n\n'
                '💎 <b>Безлимитный доступ - 299₽/мес</b>\n'
                '• Неограниченные генерации\n'
                '• Все Pro модели (DALL-E 3, FLUX Pro, Gemini Pro)\n'
                '• Приоритетная обработка\n\n'
                'Напишите /pay для оплаты'
            )
            send_telegram_message(bot_token, chat_id, limit_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Проверка доступа к платной модели
        is_paid_model = preferred_model not in [m['id'] for m in IMAGE_MODELS['free']]
        if is_paid_model and not is_paid:
            send_telegram_message(bot_token, chat_id, 
                '⚠️ Вы выбрали Pro модель, но у вас нет подписки.\n\n'
                'Используется бесплатная модель Gemini 2.5 Flash.\n\n'
                'Для доступа к Pro моделям напишите /pay'
            )
            preferred_model = 'google/gemini-2.5-flash-image-preview:free'
        
        print(f"[GENERATE] Model: {preferred_model}, Prompt: {message_text[:50]}")
        all_models = IMAGE_MODELS['free'] + IMAGE_MODELS['paid']
        model_name = next((m['name'] for m in all_models if m['id'] == preferred_model), preferred_model)
        
        send_telegram_message(bot_token, chat_id, f'⏳ Генерирую с помощью {model_name}...\n\nЭто займет 10-60 секунд.')
        
        image_url = generate_image_openrouter(message_text, preferred_model)
        
        if image_url:
            print(f"[SUCCESS] Image: {image_url[:100]}")
            cdn_url = upload_to_s3(image_url, telegram_id)
            final_url = cdn_url if cdn_url else image_url
            
            caption = f'✅ Готово!\n\n💬 {message_text[:100]}\n🎨 {model_name}'
            if not is_paid:
                caption += f'\n\n🆓 Осталось: {free_left - 1}'
            
            send_telegram_photo(bot_token, chat_id, final_url, caption)
            
            cur.execute(
                "INSERT INTO neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) VALUES (%s, %s, %s, %s, %s)",
                (telegram_id, message_text, preferred_model, final_url, is_paid)
            )
            
            if not is_paid:
                cur.execute("UPDATE neurophoto_users SET free_generations = free_generations - 1, total_used = total_used + 1 WHERE telegram_id = %s", (telegram_id,))
            else:
                cur.execute("UPDATE neurophoto_users SET total_used = total_used + 1 WHERE telegram_id = %s", (telegram_id,))
            
            conn.commit()
        else:
            send_telegram_message(bot_token, chat_id, '❌ Ошибка генерации.\n\nПопробуйте:\n• Изменить описание\n• /models - выбрать другую модель\n• Повторить через минуту')
        
        cur.close()
        conn.close()
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
    except Exception as e:
        print(f"[EXCEPTION] {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True, 'error': str(e)})}