import json
import os
from typing import Dict, Any, Optional
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

IMAGE_MODELS = {
    'free': [
        {'id': 'google/gemini-2.5-flash-image-preview:free', 'name': 'Gemini Flash (Free)', 'emoji': '⚡'},
    ],
    'paid': [
        {'id': 'openai/dall-e-3', 'name': 'DALL-E 3', 'emoji': '🎨'},
        {'id': 'black-forest-labs/flux-pro', 'name': 'FLUX Pro', 'emoji': '🌟'},
        {'id': 'google/gemini-2.5-flash-image', 'name': 'Gemini Flash', 'emoji': '⚡'},
        {'id': 'google/gemini-3-pro-image-preview', 'name': 'Gemini 3 Pro', 'emoji': '💎'},
    ]
}

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


def get_model_keyboard(is_paid: bool):
    '''Генерация клавиатуры выбора модели'''
    buttons = []
    
    if not is_paid:
        for model in IMAGE_MODELS['free']:
            buttons.append([{'text': f"{model['emoji']} {model['name']}", 'callback_data': f"model:{model['id']}"}])
        buttons.append([{'text': '💎 Разблокировать Pro модели', 'callback_data': 'upgrade'}])
    else:
        for model in IMAGE_MODELS['paid']:
            buttons.append([{'text': f"{model['emoji']} {model['name']}", 'callback_data': f"model:{model['id']}"}])
    
    buttons.append([{'text': '↩️ Назад', 'callback_data': 'back'}])
    return {'inline_keyboard': buttons}


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
        
        if 'callback_query' in update:
            callback = update['callback_query']
            chat_id = str(callback['message']['chat']['id'])
            telegram_id = callback['from']['id']
            data = callback['data']
            
            bot_token = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
            db_url = os.environ.get('DATABASE_URL')
            
            if not db_url:
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if data.startswith('model:'):
                model_id = data.split(':', 1)[1]
                cur.execute("UPDATE neurophoto_users SET preferred_model = %s WHERE telegram_id = %s", (model_id, telegram_id))
                conn.commit()
                
                model_name = next((m['name'] for m in IMAGE_MODELS['free'] + IMAGE_MODELS['paid'] if m['id'] == model_id), 'Unknown')
                send_telegram_message(bot_token, chat_id, f"✅ Модель изменена на: {model_name}\n\nТеперь просто отправьте описание изображения!")
            
            elif data == 'upgrade':
                send_telegram_message(bot_token, chat_id, 
                    '💎 <b>Нейрофотосессия PRO</b>\n\n'
                    '<b>Безлимитная подписка - 299₽/мес</b>\n\n'
                    '✅ Неограниченные генерации\n'
                    '✅ Все Pro модели (DALL-E 3, FLUX Pro, Gemini Pro)\n'
                    '✅ Приоритетная обработка\n'
                    '✅ Без очередей\n\n'
                    'Для оплаты напишите: /pay'
                )
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if 'message' not in update:
            print("[WEBHOOK] No message in update, skipping")
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        message = update['message']
        chat_id = str(message['chat']['id'])
        telegram_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', '')
        message_text = message.get('text', '')
        
        print(f"[MESSAGE] From {username} ({telegram_id}): {message_text}")
        
        bot_token = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
        db_url = os.environ.get('DATABASE_URL')
        
        if not db_url:
            print("[ERROR] DATABASE_URL not found")
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True, 'error': 'No db'})}
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if message_text in ['/start', '/help', 'Помощь', 'помощь']:
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
                '3. Получите сгенерированное фото за 10-30 сек\n\n'
                '<b>Примеры запросов:</b>\n'
                '• Портрет девушки с голубыми глазами\n'
                '• Закат над океаном в стиле импрессионизм\n'
                '• Современный офис с панорамными окнами\n\n'
                '<b>Лимиты:</b>\n'
                '🆓 Бесплатно: 10 изображений\n'
                '💎 PRO: 299₽/мес - безлимит + все модели\n\n'
                'Просто напишите описание изображения!'
            )
            print(f"[HELP] Sending help to {chat_id}")
            send_telegram_message(bot_token, chat_id, help_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if message_text == '/models':
            cur.execute("SELECT paid_generations FROM neurophoto_users WHERE telegram_id = %s", (telegram_id,))
            user = cur.fetchone()
            is_paid = user and user['paid_generations'] > 0 if user else False
            
            models_text = '📱 <b>Выберите модель генерации:</b>\n\n'
            if not is_paid:
                models_text += '🆓 <b>Бесплатные модели:</b>\n'
                for model in IMAGE_MODELS['free']:
                    models_text += f"{model['emoji']} {model['name']}\n"
                models_text += '\n💎 Разблокируйте Pro модели за 299₽/мес'
            else:
                models_text += '💎 <b>Pro модели:</b>\n'
                for model in IMAGE_MODELS['paid']:
                    models_text += f"{model['emoji']} {model['name']}\n"
            
            send_telegram_message(bot_token, chat_id, models_text, get_model_keyboard(is_paid))
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        if message_text == '/stats':
            cur.execute("SELECT free_generations, paid_generations, total_used, preferred_model FROM neurophoto_users WHERE telegram_id = %s", (telegram_id,))
            user = cur.fetchone()
            
            if user:
                is_paid = user['paid_generations'] > 0
                model_name = next((m['name'] for m in IMAGE_MODELS['free'] + IMAGE_MODELS['paid'] if m['id'] == user.get('preferred_model', '')), 'Gemini Flash (Free)')
                
                stats_text = (
                    f'📊 <b>Ваша статистика</b>\n\n'
                    f'🎨 Текущая модель: {model_name}\n'
                    f'📈 Всего сгенерировано: {user["total_used"]}\n'
                    f'🆓 Бесплатных осталось: {user["free_generations"]}\n'
                )
                if is_paid:
                    stats_text += f'💎 Pro доступ: активен\n'
                else:
                    stats_text += '\n💎 Хотите безлимит? Напишите /pay'
            else:
                stats_text = '❌ Пользователь не найден. Напишите /start для регистрации.'
            
            send_telegram_message(bot_token, chat_id, stats_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        print(f"[DB] Upserting user {telegram_id}")
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
        
        if not is_paid and free_left <= 0:
            limit_text = (
                '❌ <b>Бесплатный лимит исчерпан</b>\n\n'
                'Вы использовали все 10 бесплатных генераций.\n\n'
                '💎 <b>Безлимитный доступ - 299₽/мес</b>\n'
                '• Неограниченные генерации\n'
                '• Все Pro модели (DALL-E 3, FLUX Pro)\n'
                '• Приоритетная обработка\n\n'
                'Напишите /pay для оплаты'
            )
            print(f"[LIMIT] User {telegram_id} reached limit")
            send_telegram_message(bot_token, chat_id, limit_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        print(f"[GENERATE] Starting image generation: {message_text[:50]}")
        send_telegram_message(bot_token, chat_id, f'⏳ Генерирую изображение с помощью {preferred_model}...\n\nЭто займет 10-60 секунд.')
        
        image_url = generate_image_openrouter(message_text, preferred_model)
        
        if image_url:
            print(f"[SUCCESS] Image generated: {image_url[:100]}")
            cdn_url = upload_to_s3(image_url, telegram_id)
            final_url = cdn_url if cdn_url else image_url
            
            model_name = next((m['name'] for m in IMAGE_MODELS['free'] + IMAGE_MODELS['paid'] if m['id'] == preferred_model), preferred_model)
            caption = f'✅ Готово!\n\n💬 Запрос: {message_text[:100]}\n🎨 Модель: {model_name}'
            if not is_paid:
                caption += f'\n\n🆓 Осталось бесплатных: {free_left - 1}'
            
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
            print(f"[DB] Generation saved for user {telegram_id}")
        else:
            error_text = '❌ Ошибка генерации изображения.\n\nПопробуйте:\n• Изменить описание\n• Выбрать другую модель (/models)\n• Повторить попытку через минуту'
            print(f"[ERROR] Image generation failed for user {telegram_id}")
            send_telegram_message(bot_token, chat_id, error_text)
        
        cur.close()
        conn.close()
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
    except Exception as e:
        print(f"[EXCEPTION] {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True, 'error': str(e)})}
