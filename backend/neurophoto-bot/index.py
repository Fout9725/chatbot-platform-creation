import json
import os
from typing import Dict, Any, Optional
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

def send_telegram_message(bot_token: str, chat_id: str, text: str) -> bool:
    '''Отправка текстового сообщения в Telegram'''
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(
        telegram_url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error sending message: {e}")
        return False


def send_telegram_photo(bot_token: str, chat_id: str, photo_url: str, caption: str = '') -> bool:
    '''Отправка изображения в Telegram'''
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
    data = json.dumps({
        'chat_id': chat_id,
        'photo': photo_url,
        'caption': caption,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(
        telegram_url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error sending photo: {e}")
        return False


def generate_image_openrouter(prompt: str, model: str = 'openai/dall-e-3') -> Optional[str]:
    '''Генерация изображения через OpenRouter API'''
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        print("ERROR: No OPENROUTER_API_KEY")
        return None
    
    url = 'https://openrouter.ai/api/v1/chat/completions'
    
    data = json.dumps({
        'model': model,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'text', 'text': prompt}
            ]
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
        with urllib.request.urlopen(req, timeout=60) as response:
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
            
            print(f"No image URL in OpenRouter response: {content}")
            return None
    except Exception as e:
        print(f"Error generating image: {e}")
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
        s3.put_object(
            Bucket='files',
            Key=key,
            Body=image_data,
            ContentType='image/png'
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return cdn_url
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Telegram бот для генерации AI-изображений (Нейрофотосессия)
    '''
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
        
        if 'message' not in update:
            print("[WEBHOOK] No message in update, skipping")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'ok': True})
            }
        
        message = update['message']
        chat_id = str(message['chat']['id'])
        telegram_id = message['from']['id']
        username = message['from'].get('username', '')
        message_text = message.get('text', '')
        
        print(f"[MESSAGE] From {username} ({telegram_id}): {message_text}")
        
        bot_token = os.environ.get('NEUROPHOTO_BOT_TOKEN')
        db_url = os.environ.get('DATABASE_URL')
        
        print(f"[CONFIG] Token exists: {bool(bot_token)}, DB exists: {bool(db_url)}")
        
        if not bot_token:
            print("[ERROR] NEUROPHOTO_BOT_TOKEN not found")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'ok': True, 'error': 'No token'})
            }
        
        if not db_url:
            print("[ERROR] DATABASE_URL not found")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'ok': True, 'error': 'No db'})
            }
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if message_text in ['/start', '/help', 'Помощь', 'помощь']:
            help_text = (
                '🎨 <b>Нейрофотосессия PRO</b>\n\n'
                'Создавайте профессиональные AI-фотографии!\n\n'
                '<b>Как пользоваться:</b>\n'
                '1. Опишите изображение текстом\n'
                '2. Получите сгенерированное фото\n\n'
                '<b>Примеры запросов:</b>\n'
                '• Портрет девушки с голубыми глазами\n'
                '• Закат над океаном\n'
                '• Современный офис\n\n'
                '<b>Лимиты:</b>\n'
                '🆓 Бесплатно: 10 изображений\n'
                '💎 Безлимит: 299₽/мес\n\n'
                'Просто напишите описание изображения!'
            )
            print(f"[HELP] Sending help to {chat_id}")
            send_telegram_message(bot_token, chat_id, help_text)
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'ok': True})
            }
        
        print(f"[DB] Upserting user {telegram_id}")
        cur.execute(
            "INSERT INTO neurophoto_users (telegram_id, username) VALUES (%s, %s) "
            "ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username "
            "RETURNING free_generations, paid_generations, total_used",
            (telegram_id, username)
        )
        user_data = cur.fetchone()
        conn.commit()
        
        free_left = max(0, user_data['free_generations'])
        is_paid = user_data['paid_generations'] > 0
        
        print(f"[USER] Free: {free_left}, Paid: {is_paid}, Total used: {user_data['total_used']}")
        
        if not is_paid and free_left <= 0:
            limit_text = (
                '❌ <b>Бесплатный лимит исчерпан</b>\n\n'
                'Вы использовали все бесплатные генерации.\n\n'
                '💎 <b>Безлимитный доступ - 299₽/мес</b>\n'
                '• Неограниченные генерации\n'
                '• Приоритетная обработка\n'
                '• Все модели доступны\n\n'
                'Напишите /pay для оплаты'
            )
            print(f"[LIMIT] User {telegram_id} reached limit")
            send_telegram_message(bot_token, chat_id, limit_text)
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'ok': True})
            }
        
        print(f"[GENERATE] Starting image generation for: {message_text[:50]}")
        send_telegram_message(bot_token, chat_id, '⏳ Генерирую изображение... Это займет 10-30 секунд.')
        
        image_url = generate_image_openrouter(message_text, 'openai/dall-e-3')
        
        if image_url:
            print(f"[SUCCESS] Image generated: {image_url[:100]}")
            cdn_url = upload_to_s3(image_url, telegram_id)
            final_url = cdn_url if cdn_url else image_url
            
            caption = f'✅ Готово!\n\n💬 Запрос: {message_text[:100]}'
            if not is_paid:
                caption += f'\n\n🆓 Осталось бесплатных: {free_left - 1}'
            
            send_telegram_photo(bot_token, chat_id, final_url, caption)
            
            cur.execute(
                "INSERT INTO neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) "
                "VALUES (%s, %s, %s, %s, %s)",
                (telegram_id, message_text, 'dall-e-3', final_url, is_paid)
            )
            
            if not is_paid:
                cur.execute(
                    "UPDATE neurophoto_users SET free_generations = free_generations - 1, total_used = total_used + 1 "
                    "WHERE telegram_id = %s",
                    (telegram_id,)
                )
            else:
                cur.execute(
                    "UPDATE neurophoto_users SET total_used = total_used + 1 WHERE telegram_id = %s",
                    (telegram_id,)
                )
            
            conn.commit()
            print(f"[DB] Generation saved for user {telegram_id}")
        else:
            error_text = '❌ Ошибка генерации изображения. Попробуйте еще раз или измените описание.'
            print(f"[ERROR] Image generation failed for user {telegram_id}")
            send_telegram_message(bot_token, chat_id, error_text)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'ok': True})
        }
        
    except Exception as e:
        print(f"[EXCEPTION] {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'ok': True, 'error': str(e)})
        }
