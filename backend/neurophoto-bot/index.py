import json
import os
import base64
from typing import Dict, Any, Optional, List
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

ADMIN_IDS = [285675692]
DB_SCHEMA = 't_p60354232_chatbot_platform_cre'
# v4.1 - Исправлена модель на gemini-2.5-flash-image для генерации изображений через Google AI API.

GEMINI_MODEL = 'gemini-2.5-flash-image'

def is_admin(telegram_id: int) -> bool:
    return telegram_id in ADMIN_IDS

def send_telegram_message(bot_token: str, chat_id: str, text: str, reply_markup: Optional[dict] = None) -> bool:
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
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('ok', False)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[ERROR] Telegram API error {e.code}: {error_body}")
        return False
    except Exception as e:
        print(f"[ERROR] Send photo exception: {type(e).__name__}: {e}")
        return False

def get_telegram_file_url(bot_token: str, file_id: str) -> Optional[str]:
    try:
        get_file_url = f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}'
        req = urllib.request.Request(get_file_url)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('ok'):
                file_path = result['result']['file_path']
                download_url = f'https://api.telegram.org/file/bot{bot_token}/{file_path}'
                return download_url
            return None
    except Exception as e:
        print(f"[ERROR] Get file URL: {e}")
        return None

def answer_callback_query(bot_token: str, callback_query_id: str, text: str = '', show_alert: bool = False) -> bool:
    telegram_url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
    payload = {
        'callback_query_id': callback_query_id,
        'text': text,
        'show_alert': show_alert
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"[ERROR] Answer callback: {e}")
        return False

def download_image_as_base64(url: str) -> Optional[str]:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as response:
            image_data = response.read()
            return base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        print(f"[ERROR] Download image: {e}")
        return None

def generate_image_gemini(prompt: str, image_urls: List[str] = None, bot_token: str = None, chat_id: str = None) -> Optional[str]:
    """Генерация изображения через Google Gemini API напрямую"""
    def dbg(msg):
        print(f"[GEMINI] {msg}")
        if bot_token and chat_id:
            send_telegram_message(bot_token, chat_id, f'🔧 {msg}')

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        dbg('GEMINI_API_KEY не найден в env')
        return None
    
    dbg(f'Key: {api_key[:8]}..., model: {GEMINI_MODEL}')
    
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}'
    
    parts = []
    
    if image_urls:
        parts.append({'text': f"{prompt}\n\nСоздай изображение на основе этих примеров:"})
        for img_url in image_urls:
            img_b64 = download_image_as_base64(img_url)
            if img_b64:
                parts.append({
                    'inline_data': {
                        'mime_type': 'image/jpeg',
                        'data': img_b64
                    }
                })
    else:
        parts.append({'text': prompt})
    
    request_body = {
        'contents': [{
            'parts': parts
        }],
        'generationConfig': {
            'responseModalities': ['TEXT', 'IMAGE']
        }
    }
    
    data = json.dumps(request_body).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            response_body = response.read().decode('utf-8')
            result = json.loads(response_body)
            
            if 'candidates' not in result or len(result['candidates']) == 0:
                dbg(f'No candidates. Keys: {list(result.keys())}. Body: {response_body[:300]}')
                return None
            
            candidate = result['candidates'][0]
            
            finish_reason = candidate.get('finishReason', 'unknown')
            content = candidate.get('content', {})
            parts_resp = content.get('parts', [])
            
            dbg(f'Got {len(parts_resp)} parts, finishReason={finish_reason}')
            
            for part in parts_resp:
                if 'inlineData' in part:
                    inline = part['inlineData']
                    mime = inline.get('mimeType', 'image/png')
                    b64_data = inline.get('data', '')
                    if b64_data:
                        dbg(f'Image found! mime={mime}, size={len(b64_data)}')
                        return f"data:{mime};base64,{b64_data}"
                if 'inline_data' in part:
                    inline = part['inline_data']
                    mime = inline.get('mime_type', 'image/png')
                    b64_data = inline.get('data', '')
                    if b64_data:
                        dbg(f'Image found! mime={mime}, size={len(b64_data)}')
                        return f"data:{mime};base64,{b64_data}"
            
            part_keys = [list(p.keys()) for p in parts_resp]
            text_parts = [p.get('text', '')[:100] for p in parts_resp if 'text' in p]
            dbg(f'No image! Part keys: {part_keys}. Texts: {text_parts}')
            return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        dbg(f'HTTP {e.code}: {error_body[:300]}')
        return None
    except Exception as e:
        import traceback
        dbg(f'Exception: {type(e).__name__}: {str(e)[:200]}')
        print(traceback.format_exc())
        return None

def upload_to_s3(image_url: str, telegram_id: int) -> Optional[str]:
    try:
        if image_url.startswith('data:image'):
            header, encoded = image_url.split(',', 1)
            image_data = base64.b64decode(encoded)
        else:
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
        import traceback
        print(traceback.format_exc())
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Telegram бот для генерации AI-изображений (Нейрофотосессия) через Google Gemini API'''
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
        print(f"[WEBHOOK] ========== NEW REQUEST ==========")
        print(f"[WEBHOOK] Body length: {len(body_str)}")
        
        update = json.loads(body_str)
        update_id = update.get('update_id')
        
        bot_token = os.environ.get('NEUROPHOTO_BOT_TOKEN', '8257588939:AAEYZYndyra3FLca5VpIFRkk8gHH1GGd48w')
        db_url = os.environ.get('DATABASE_URL')
        
        if not db_url:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # /start
        if 'message' in update:
            quick_message = update['message']
            quick_text = quick_message.get('text', '')
            if quick_text == '/start':
                chat_id = str(quick_message['chat']['id'])
                telegram_id = quick_message['from']['id']
                username = quick_message['from'].get('username', '')
                first_name = quick_message['from'].get('first_name', 'User')
                
                try:
                    cur.execute(
                        f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) "
                        f"VALUES (%s, %s, %s) "
                        f"ON CONFLICT (telegram_id) DO UPDATE SET "
                        f"username = EXCLUDED.username, first_name = EXCLUDED.first_name, "
                        f"session_state = NULL, session_photo_url = NULL, session_photo_prompt = NULL",
                        (telegram_id, username, first_name)
                    )
                    conn.commit()
                except Exception as e:
                    print(f"[ERROR] Create user: {e}")
                
                keyboard = {
                    'inline_keyboard': [
                        [{'text': '📖 Инструкция', 'callback_data': 'instruction'}],
                        [{'text': '📊 Статистика', 'callback_data': 'show_stats'}]
                    ]
                }
                help_text = (
                    '🎨 <b>Нейрофотосессия PRO</b>\n\n'
                    'Создавайте профессиональные AI-фотографии!\n\n'
                    '<b>Как пользоваться:</b>\n'
                    '1. Отправьте текст — получите изображение\n'
                    '2. Отправьте фото с подписью — редактирование\n'
                    '3. Несколько фото + подпись — объединение\n\n'
                    '⚡ Модель: Gemini 2.5 Flash\n'
                    '💎 PRO: 299₽/мес - безлимит'
                )
                send_telegram_message(bot_token, chat_id, help_text, keyboard)
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Дедупликация
        if update_id:
            cur.execute(
                f"SELECT COUNT(*) as count FROM {DB_SCHEMA}.neurophoto_processed_updates WHERE update_id = %s",
                (update_id,)
            )
            already_processed = cur.fetchone()['count'] > 0
            
            if already_processed:
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True, 'skipped': 'duplicate'})}
            
            cur.execute(
                f"INSERT INTO {DB_SCHEMA}.neurophoto_processed_updates (update_id) VALUES (%s) ON CONFLICT DO NOTHING",
                (update_id,)
            )
            conn.commit()
            
            cur.execute(
                f"DELETE FROM {DB_SCHEMA}.neurophoto_processed_updates WHERE processed_at < NOW() - INTERVAL '1 hour'"
            )
            conn.commit()
        
        # Callback кнопки
        if 'callback_query' in update:
            try:
                callback = update['callback_query']
                chat_id = str(callback['message']['chat']['id'])
                telegram_id = callback['from']['id']
                username = callback['from'].get('username', '')
                first_name = callback['from'].get('first_name', '')
                callback_query_id = callback['id']
                data = callback['data']
                
                answer_callback_query(bot_token, callback_query_id)
                
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
                    f"ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name",
                    (telegram_id, username, first_name)
                )
                conn.commit()
                
                if data == 'instruction':
                    instruction_text = (
                        '📖 <b>Инструкция</b>\n\n'
                        '<b>🎨 Что умеет бот:</b>\n'
                        '• Генерация изображений из текста\n'
                        '• Обработка фото (редактирование, стилизация)\n'
                        '• Работа с несколькими фото одновременно\n\n'
                        '<b>📸 Работа с фото:</b>\n'
                        '1. Отправьте одно или несколько фото\n'
                        '2. К последнему фото добавьте подпись с заданием\n\n'
                        '<b>Примеры заданий:</b>\n'
                        '• "Сделай фон белым"\n'
                        '• "Убери лишние объекты"\n'
                        '• "Улучши качество фото"\n'
                        '• "Объедини эти фото в одно"\n\n'
                        '<b>✍️ Работа с текстом:</b>\n'
                        'Просто опишите что хотите увидеть!\n\n'
                        '<b>Примеры:</b>\n'
                        '• "Космонавт в открытом космосе, реалистично"\n'
                        '• "Уютное кафе в Париже, вечер, дождь"\n'
                        '• "Портрет девушки, стиль ренессанс"\n\n'
                        '⚡ Модель: Gemini 2.5 Flash\n'
                        '⏱ Скорость: ~15-30 сек\n\n'
                        '💎 <b>PRO: 299₽/мес</b> — безлимит\n'
                        'Оформить: /pay'
                    )
                    send_telegram_message(bot_token, chat_id, instruction_text)
                
                elif data == 'show_stats':
                    cur.execute(f"SELECT paid_generations, total_used FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s", (telegram_id,))
                    user = cur.fetchone()
                    
                    if user:
                        is_paid = user['paid_generations'] > 0
                        stats_text = (
                            f'📊 <b>Ваша статистика</b>\n\n'
                            f'🎨 Модель: Gemini 2.5 Flash\n'
                            f'📈 Всего сгенерировано: {user["total_used"]}\n'
                        )
                        if is_paid:
                            stats_text += '💎 Pro доступ: активен (безлимит)\n'
                        else:
                            stats_text += '\n💎 Для доступа к генерации напишите /pay'
                    else:
                        stats_text = '❌ Пользователь не найден. Напишите /start'
                    
                    send_telegram_message(bot_token, chat_id, stats_text)
                
                elif data == 'back':
                    send_telegram_message(bot_token, chat_id, 'Главное меню. Напишите /help для справки.')
                
                elif data == 'choose_model' or data.startswith('model:'):
                    send_telegram_message(bot_token, chat_id, '⚡ Сейчас используется единая модель Gemini 2.5 Flash.\nПросто отправьте текст или фото!')
                
            except Exception as callback_error:
                print(f"[CALLBACK ERROR] {type(callback_error).__name__}: {str(callback_error)}")
                import traceback
                print(traceback.format_exc())
            finally:
                cur.close()
                conn.close()
            
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if 'message' not in update:
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        message = update['message']
        chat_id = str(message['chat']['id'])
        telegram_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', '')
        message_text = message.get('text', '') or message.get('caption', '')
        
        photo_urls = []
        media_group_id = message.get('media_group_id')
        file_url = None
        generation_id = None
        
        if 'photo' in message:
            largest_photo = message['photo'][-1]
            file_url = get_telegram_file_url(bot_token, largest_photo['file_id'])
            if file_url:
                if not media_group_id:
                    photo_urls.append(file_url)
        
        if media_group_id and file_url:
            generation_id = media_group_id
            
            try:
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
                    f"ON CONFLICT (telegram_id) DO NOTHING",
                    (telegram_id, username, first_name)
                )
                
                cur.execute(
                    f"UPDATE {DB_SCHEMA}.neurophoto_users SET "
                    f"session_state = 'collecting_photos', "
                    f"session_photo_url = CASE WHEN session_photo_url IS NULL OR session_photo_url = '' THEN %s ELSE session_photo_url || '|' || %s END, "
                    f"session_photo_prompt = %s, "
                    f"session_updated_at = NOW() "
                    f"WHERE telegram_id = %s",
                    (file_url, file_url, message_text, telegram_id)
                )
                conn.commit()
                
                if message_text:
                    cur.execute(
                        f"SELECT COUNT(*) as count FROM {DB_SCHEMA}.neurophoto_generations "
                        f"WHERE telegram_id = %s AND prompt = %s AND created_at > NOW() - INTERVAL '2 minutes'",
                        (telegram_id, f"media_group:{media_group_id}")
                    )
                    already_processed = cur.fetchone()['count'] > 0
                    
                    if already_processed:
                        cur.close()
                        conn.close()
                        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                    
                    cur.execute(
                        f"INSERT INTO {DB_SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) "
                        f"VALUES (%s, %s, %s, %s, %s)",
                        (telegram_id, f"media_group:{media_group_id}", 'processing', 'pending', False)
                    )
                    conn.commit()
                    
                    cur.execute(
                        f"SELECT session_photo_url FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s",
                        (telegram_id,)
                    )
                    session = cur.fetchone()
                    if session and session['session_photo_url']:
                        photo_urls = [url for url in session['session_photo_url'].split('|') if url.strip()]
                        cur.execute(
                            f"UPDATE {DB_SCHEMA}.neurophoto_users SET "
                            f"session_state = NULL, session_photo_url = NULL, session_photo_prompt = NULL "
                            f"WHERE telegram_id = %s",
                            (telegram_id,)
                        )
                        conn.commit()
                    else:
                        cur.close()
                        conn.close()
                        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                else:
                    cur.close()
                    conn.close()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                    
            except Exception as e:
                print(f"[ERROR] Media group: {e}")
                import traceback
                print(traceback.format_exc())
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /admin
        if message_text == '/admin':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT COUNT(*) as total_users FROM {DB_SCHEMA}.neurophoto_users")
            total_users = cur.fetchone()['total_users']
            
            cur.execute(f"SELECT COUNT(*) as paid_users FROM {DB_SCHEMA}.neurophoto_users WHERE paid_generations > 0")
            paid_users = cur.fetchone()['paid_users']
            
            cur.execute(f"SELECT SUM(total_used) as total_gens FROM {DB_SCHEMA}.neurophoto_users")
            total_gens = cur.fetchone()['total_gens'] or 0
            
            cur.execute(f"SELECT COUNT(*) as today_gens FROM {DB_SCHEMA}.neurophoto_generations WHERE created_at > NOW() - INTERVAL '1 day'")
            today_gens = cur.fetchone()['today_gens']
            
            admin_text = (
                '👑 <b>Админ-панель</b>\n\n'
                f'👥 Пользователей: {total_users}\n'
                f'💎 Платных: {paid_users}\n'
                f'🎨 Всего генераций: {total_gens}\n'
                f'📊 Сегодня: {today_gens}\n\n'
                '⚡ Модель: Gemini 2.5 Flash (Google AI)\n\n'
                '<b>Команды:</b>\n'
                '/admin - панель\n'
                '/users - пользователи\n'
                '/topusers - топ\n'
                '/addpro [@login] - выдать Pro\n'
                '/addgens [@login] [n] - бесплатные\n'
                '/addpaidgens [@login] [n] - платные\n'
                '/userinfo [@login] - инфо\n'
                '/setwebhook - webhook\n'
                '/broadcast [текст] - рассылка'
            )
            send_telegram_message(bot_token, chat_id, admin_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /users
        if message_text == '/users':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT telegram_id, username, first_name, total_used, paid_generations FROM {DB_SCHEMA}.neurophoto_users ORDER BY created_at DESC LIMIT 20")
            users = cur.fetchall()
            
            users_text = '👥 <b>Последние 20 пользователей:</b>\n\n'
            for user in users:
                status = '💎' if user['paid_generations'] > 0 else '❌'
                users_text += f"{user['telegram_id']} (@{user['username'] or 'noname'}) - {user['total_used']} ген. - {status}\n"
            
            send_telegram_message(bot_token, chat_id, users_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /topusers
        if message_text == '/topusers':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT telegram_id, username, total_used, paid_generations FROM {DB_SCHEMA}.neurophoto_users ORDER BY total_used DESC LIMIT 15")
            users = cur.fetchall()
            
            top_text = '🏆 <b>Топ-15:</b>\n\n'
            for i, user in enumerate(users, 1):
                status = '💎' if user['paid_generations'] > 0 else '🆓'
                top_text += f"{i}. {status} @{user['username'] or user['telegram_id']} - {user['total_used']}\n"
            
            send_telegram_message(bot_token, chat_id, top_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /addpro
        if message_text.startswith('/addpro'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                user_input = message_text.split()[1].lstrip('@')
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = 999999 WHERE telegram_id = %s RETURNING telegram_id, username", (user_id,))
                    result = cur.fetchone()
                    if not result:
                        cur.execute(
                            f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, paid_generations) "
                            f"VALUES (%s, %s, 999999) RETURNING telegram_id, username",
                            (user_id, str(user_id))
                        )
                        result = cur.fetchone()
                        conn.commit()
                        send_telegram_message(bot_token, chat_id, f'✅ Создан пользователь {user_id} с Pro')
                    else:
                        conn.commit()
                        send_telegram_message(bot_token, chat_id, f'✅ Pro выдана @{result["username"] or result["telegram_id"]}')
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = 999999 WHERE username = %s RETURNING telegram_id, username", (user_input,))
                    result = cur.fetchone()
                    if result:
                        conn.commit()
                        send_telegram_message(bot_token, chat_id, f'✅ Pro выдана @{result["username"] or result["telegram_id"]}')
                    else:
                        send_telegram_message(bot_token, chat_id, f'❌ @{user_input} не найден')
            except IndexError:
                send_telegram_message(bot_token, chat_id, '❌ Формат: /addpro [@username или ID]')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /addgens
        if message_text.startswith('/addgens'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET free_generations = free_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET free_generations = free_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                result = cur.fetchone()
                if result:
                    conn.commit()
                    send_telegram_message(bot_token, chat_id, f'✅ +{amount} генераций для @{result["username"] or result["telegram_id"]}')
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Формат: /addgens [@login] [кол-во]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /addpaidgens
        if message_text.startswith('/addpaidgens'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = paid_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = paid_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                result = cur.fetchone()
                if result:
                    conn.commit()
                    send_telegram_message(bot_token, chat_id, f'✅ +{amount} платных генераций для @{result["username"] or result["telegram_id"]}')
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Формат: /addpaidgens [@login] [кол-во]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /userinfo
        if message_text.startswith('/userinfo'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                user_input = message_text.split()[1].lstrip('@')
                try:
                    user_id = int(user_input)
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s", (user_id,))
                except ValueError:
                    cur.execute(f"SELECT * FROM {DB_SCHEMA}.neurophoto_users WHERE username = %s", (user_input,))
                user = cur.fetchone()
                if user:
                    cur.execute(f"SELECT COUNT(*) as gens_count FROM {DB_SCHEMA}.neurophoto_generations WHERE telegram_id = %s", (user['telegram_id'],))
                    gens = cur.fetchone()['gens_count']
                    status = '💎 PRO' if user['paid_generations'] > 0 else '🆓 Free'
                    info_text = (
                        f'👤 <b>Пользователь</b>\n\n'
                        f'ID: {user["telegram_id"]}\n'
                        f'@{user["username"] or "нет"}\n'
                        f'Имя: {user["first_name"] or "—"}\n'
                        f'Статус: {status}\n'
                        f'🆓 Бесплатных: {user["free_generations"]}\n'
                        f'💎 Платных: {user["paid_generations"]}\n'
                        f'📊 Использовано: {user["total_used"]}\n'
                        f'🗄️ В БД: {gens}\n'
                        f'📅 Рег: {user["created_at"]}'
                    )
                    send_telegram_message(bot_token, chat_id, info_text)
                else:
                    send_telegram_message(bot_token, chat_id, '❌ Не найден')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Формат: /userinfo [@login или ID]')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /setwebhook
        if message_text == '/setwebhook':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            webhook_url = 'https://functions.poehali.dev/deae2fef-4b07-485f-85ae-56450c446d2f'
            set_webhook_url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
            
            payload = json.dumps({
                'url': webhook_url,
                'allowed_updates': ['message', 'callback_query']
            }).encode('utf-8')
            req = urllib.request.Request(set_webhook_url, data=payload, headers={'Content-Type': 'application/json'})
            
            try:
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    if result.get('ok'):
                        send_telegram_message(bot_token, chat_id, f'✅ Webhook установлен')
                    else:
                        send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {result.get("description", "Unknown")}')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}')
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /help
        if message_text == '/help':
            keyboard = {
                'inline_keyboard': [
                    [{'text': '📖 Инструкция', 'callback_data': 'instruction'}],
                    [{'text': '📊 Статистика', 'callback_data': 'show_stats'}]
                ]
            }
            help_text = (
                '🎨 <b>Нейрофотосессия PRO</b>\n\n'
                'Создавайте AI-фотографии!\n\n'
                '<b>Команды:</b>\n'
                '/stats - Статистика\n'
                '/instruction - Инструкция\n\n'
                '<b>Быстрый старт:</b>\n'
                '1. Отправьте текст или фото\n'
                '2. Получите результат за 15-30 сек\n\n'
                '⚡ Модель: Gemini 2.5 Flash\n'
                '💎 PRO: 299₽/мес - безлимит'
            )
            send_telegram_message(bot_token, chat_id, help_text, keyboard)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /instruction
        if message_text == '/instruction':
            instruction_text = (
                '📖 <b>Инструкция</b>\n\n'
                '<b>🎨 Что умеет бот:</b>\n'
                '• Генерация изображений из текста\n'
                '• Обработка фото\n'
                '• Работа с несколькими фото\n\n'
                '<b>📸 Фото:</b>\n'
                '1. Отправьте фото с подписью\n'
                '2. Или несколько фото, подпись к последнему\n\n'
                '<b>✍️ Текст:</b>\n'
                'Просто опишите что хотите!\n\n'
                '⚡ Модель: Gemini 2.5 Flash\n'
                '💎 PRO: 299₽/мес\n'
                'Оформить: /pay'
            )
            send_telegram_message(bot_token, chat_id, instruction_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /models - больше нет выбора
        if message_text == '/models':
            send_telegram_message(bot_token, chat_id,
                '⚡ Сейчас используется единая модель <b>Gemini 2.5 Flash</b>.\n\n'
                'Просто отправьте текст или фото для генерации!'
            )
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /stats
        if message_text == '/stats':
            cur.execute(f"SELECT paid_generations, total_used FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s", (telegram_id,))
            user = cur.fetchone()
            
            if user:
                is_paid = user['paid_generations'] > 0
                stats_text = (
                    f'📊 <b>Ваша статистика</b>\n\n'
                    f'🎨 Модель: Gemini 2.5 Flash\n'
                    f'📈 Всего: {user["total_used"]}\n'
                )
                if is_paid:
                    stats_text += '💎 Pro: активен (безлимит)\n'
                else:
                    stats_text += '\n💎 /pay для доступа'
            else:
                stats_text = '❌ Напишите /start'
            
            send_telegram_message(bot_token, chat_id, stats_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /broadcast
        if message_text.startswith('/broadcast'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            broadcast_text = message_text.replace('/broadcast', '', 1).strip()
            if not broadcast_text:
                send_telegram_message(bot_token, chat_id, '❌ Формат: /broadcast [текст]')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT telegram_id FROM {DB_SCHEMA}.neurophoto_users")
            all_users = cur.fetchall()
            
            sent = 0
            failed = 0
            for u in all_users:
                result = send_telegram_message(bot_token, str(u['telegram_id']), broadcast_text)
                if result:
                    sent += 1
                else:
                    failed += 1
            
            send_telegram_message(bot_token, chat_id, f'📨 Рассылка: ✅ {sent} / ❌ {failed}')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # /pay
        if message_text == '/pay':
            send_telegram_message(bot_token, chat_id,
                '💎 <b>Нейрофотосессия PRO — 299₽/мес</b>\n\n'
                '✅ Безлимитные генерации\n'
                '✅ Gemini 2.5 Flash\n'
                '✅ Работа с фото и текстом\n'
                '✅ Приоритетная обработка\n\n'
                'Для оплаты напишите администратору.'
            )
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Неизвестная команда
        if message_text.startswith('/'):
            send_telegram_message(bot_token, chat_id, '❓ Неизвестная команда. /help для справки.')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # === ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЯ ===
        cur.execute(
            f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
            f"ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name "
            f"RETURNING free_generations, paid_generations, total_used",
            (telegram_id, username, first_name)
        )
        user_data = cur.fetchone()
        conn.commit()
        
        is_paid = user_data['paid_generations'] > 0
        
        if not is_paid:
            send_telegram_message(bot_token, chat_id,
                '⚠️ <b>Нужна Pro подписка</b>\n\n'
                '💎 <b>Нейрофотосессия PRO — 299₽/мес</b>\n'
                '• Gemini 2.5 Flash\n'
                '• Безлимитные генерации\n'
                '• Текст + фото\n\n'
                '/pay для подключения'
            )
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if photo_urls:
            send_telegram_message(bot_token, chat_id, f'⏳ Обрабатываю {len(photo_urls)} фото через Gemini...\n\nЭто займет 15-30 секунд.')
        else:
            send_telegram_message(bot_token, chat_id, '⏳ Генерирую изображение через Gemini...\n\nЭто займет 15-30 секунд.')
        
        image_url = generate_image_gemini(message_text, photo_urls, bot_token, chat_id)
        
        if not image_url:
            send_telegram_message(bot_token, chat_id, '❌ Не удалось сгенерировать. Попробуйте изменить описание или повторить позже.')
        
        if image_url:
            if isinstance(image_url, list):
                image_url = image_url[0] if len(image_url) > 0 else None
            if isinstance(image_url, dict):
                image_url = image_url.get('url') or image_url.get('data') or None
        
        if image_url:
            cdn_url = upload_to_s3(image_url, telegram_id)
            
            if not cdn_url:
                send_telegram_message(bot_token, chat_id, '❌ Ошибка сохранения. Попробуйте еще раз.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            caption = f'✅ Готово!\n\n💬 {message_text[:100]}\n⚡ Gemini 2.5 Flash'
            
            photo_sent = send_telegram_photo(bot_token, chat_id, cdn_url, caption)
            
            if not photo_sent:
                send_telegram_message(bot_token, chat_id, f'{caption}\n\n🖼 {cdn_url}')
            
            if generation_id:
                cur.execute(
                    f"UPDATE {DB_SCHEMA}.neurophoto_generations SET "
                    f"model = %s, image_url = %s, is_paid = %s "
                    f"WHERE telegram_id = %s AND prompt = %s",
                    (GEMINI_MODEL, cdn_url, is_paid, telegram_id, f"media_group:{generation_id}")
                )
            else:
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) VALUES (%s, %s, %s, %s, %s)",
                    (telegram_id, message_text, GEMINI_MODEL, cdn_url, is_paid)
                )
            
            cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET total_used = total_used + 1 WHERE telegram_id = %s", (telegram_id,))
            conn.commit()
        else:
            send_telegram_message(bot_token, chat_id, '❌ Ошибка генерации. Попробуйте другое описание или повторите позже.')
        
        cur.close()
        conn.close()
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
    except Exception as e:
        print(f"[EXCEPTION] {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True, 'error': str(e)})}