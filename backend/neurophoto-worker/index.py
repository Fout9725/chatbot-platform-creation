'''
Business: Worker для обработки очереди генераций изображений в фоне
Args: event - dict с httpMethod (GET для проверки, POST для ручного запуска)
      context - object с request_id, function_name
Returns: HTTP response dict с статусом обработки очереди
'''

import json
import os
import requests
import psycopg2
from typing import Dict, Any, Optional
import time
import signal
from contextlib import contextmanager

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')
CALLBACK_URL = 'https://functions.poehali.dev/18e803e9-9f5e-4147-8776-dbed3f431a00'

class TimeoutException(Exception):
    pass

@contextmanager
def time_limit(seconds: int):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

IMAGE_MODELS = {
    'flux-schnell': {'id': 'black-forest-labs/flux-schnell-free', 'name': '🆓 FLUX Schnell', 'paid': False},
    'flux-pro': {'id': 'black-forest-labs/flux-pro', 'name': '🎨 FLUX Pro', 'paid': True},
    'dall-e-3': {'id': 'openai/dall-e-3', 'name': '🤖 DALL-E 3', 'paid': True},
    'stable-diffusion': {'id': 'stability-ai/stable-diffusion-xl', 'name': '⚡ Stable Diffusion XL', 'paid': False},
    'flux-1.1-pro': {'id': 'black-forest-labs/flux-1.1-pro', 'name': '🌟 FLUX 1.1 Pro', 'paid': True}
}

def get_telegram_api() -> str:
    return f'https://api.telegram.org/bot{TELEGRAM_TOKEN}'

def get_db_connection():
    if not DATABASE_URL:
        print('DATABASE_URL not configured')
        return None
    return psycopg2.connect(DATABASE_URL)

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
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo_url(chat_id: int, image_url: str, caption: str = '', reply_markup: Optional[Dict] = None) -> None:
    try:
        if image_url.startswith('data:image'):
            import base64
            header, encoded = image_url.split(',', 1)
            image_bytes = base64.b64decode(encoded)
            
            files = {'photo': ('image.png', image_bytes, 'image/png')}
            data = {
                'chat_id': chat_id,
                'caption': caption
            }
            if reply_markup:
                data['reply_markup'] = json.dumps(reply_markup)
            
            response = requests.post(f'{get_telegram_api()}/sendPhoto', data=data, files=files, timeout=30)
            print(f'sendPhoto (base64) response: {response.status_code}')
        elif image_url.startswith('http'):
            img_response = requests.get(image_url, timeout=15)
            if img_response.status_code == 200:
                files = {'photo': ('image.jpg', img_response.content, 'image/jpeg')}
                data = {
                    'chat_id': chat_id,
                    'caption': caption
                }
                if reply_markup:
                    data['reply_markup'] = json.dumps(reply_markup)
                
                response = requests.post(f'{get_telegram_api()}/sendPhoto', data=data, files=files, timeout=30)
                print(f'sendPhoto (downloaded) response: {response.status_code}')
            else:
                print(f'Failed to download image: {img_response.status_code}')
                data = {
                    'chat_id': chat_id,
                    'photo': image_url,
                    'caption': caption
                }
                if reply_markup:
                    data['reply_markup'] = json.dumps(reply_markup)
                
                response = requests.post(f'{get_telegram_api()}/sendPhoto', json=data, timeout=30)
                print(f'sendPhoto (fallback URL) response: {response.status_code}')
        else:
            data = {
                'chat_id': chat_id,
                'photo': image_url,
                'caption': caption
            }
            if reply_markup:
                data['reply_markup'] = json.dumps(reply_markup)
            
            response = requests.post(f'{get_telegram_api()}/sendPhoto', json=data, timeout=30)
            print(f'sendPhoto (URL) response: {response.status_code}')
    except Exception as e:
        print(f'Error sending photo URL: {e}')

def generate_image_paid_long(prompt: str, model: str) -> Optional[str]:
    '''
    Генерация платной модели с длинным таймаутом 25 сек
    Один запрос = одна оплата
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
    model_id = model_info['id']
    
    print(f'Paid generation with {model_info["name"]}: {prompt[:50]}...')
    
    if not OPENROUTER_API_KEY:
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
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt}
                ]
            }],
            'temperature': 1.0,
            'max_tokens': 1024
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=25
        )
        
        print(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'Response data: {json.dumps(data)[:200]}')
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                content = message.get('content')
                
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            if item.get('type') == 'image_url' and item.get('image_url', {}).get('url'):
                                return item['image_url']['url']
                            elif item.get('type') == 'image' and item.get('source', {}).get('url'):
                                return item['source']['url']
                elif isinstance(content, str):
                    if content.startswith('http'):
                        return content
                    elif content.startswith('data:image'):
                        return content
        else:
            error_text = response.text[:500] if response.text else 'No error message'
            print(f'OpenRouter error: {error_text}')
        
        return None
    except requests.exceptions.Timeout:
        print(f'Timeout after 25s')
        return None
    except Exception as e:
        print(f'Error: {e}')
        return None

def generate_image_sync(prompt: str, model: str = 'flux-schnell') -> Optional[str]:
    '''
    Синхронная генерация для бесплатных моделей (быстрые)
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
    model_id = model_info['id']
    
    print(f'Sync generation with {model_info["name"]} ({model_id}): {prompt[:100]}...')
    
    if not OPENROUTER_API_KEY:
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
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt}
                ]
            }],
            'temperature': 1.0,
            'max_tokens': 1024
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=15
        )
        
        print(f'Sync OpenRouter response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'Sync response data: {json.dumps(data)[:200]}')
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                content = message.get('content')
                
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            if item.get('type') == 'image_url' and item.get('image_url', {}).get('url'):
                                return item['image_url']['url']
                            elif item.get('type') == 'image' and item.get('source', {}).get('url'):
                                return item['source']['url']
                elif isinstance(content, str):
                    if content.startswith('http'):
                        return content
                    elif content.startswith('data:image'):
                        return content
        
        elif response.status_code == 429:
            print('Rate limit hit')
            return 'TIMEOUT'
        else:
            error_text = response.text[:500] if response.text else 'No error message'
            print(f'Sync OpenRouter error: {error_text}')
        
        return None
    except Exception as e:
        print(f'Sync generation error: {e}')
        return None

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

def get_effects_keyboard() -> Dict:
    return {
        'inline_keyboard': [
            [{'text': '🎭 Драматический', 'callback_data': 'effect_dramatic'}, {'text': '📷 Винтаж', 'callback_data': 'effect_vintage'}],
            [{'text': '✨ Гламур', 'callback_data': 'effect_glamour'}, {'text': '🎬 Нуар', 'callback_data': 'effect_noir'}],
            [{'text': '🌃 Неон', 'callback_data': 'effect_neon'}, {'text': '🎨 Пастель', 'callback_data': 'effect_pastel'}],
            [{'text': '✅ Оставить как есть', 'callback_data': 'effect_none'}],
            [{'text': '🔄 Создать новое фото', 'callback_data': 'new_photo'}]
        ]
    }

def process_queue_item(item: Dict) -> bool:
    '''
    Обрабатывает задачу: бесплатные синхронно, платные через webhook
    '''
    queue_id = item['id']
    chat_id = item['chat_id']
    telegram_id = item['telegram_id']
    prompt = item['prompt']
    model = item['model']
    is_paid = item['is_paid']
    retry_count = item.get('retry_count', 0)
    
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        if retry_count == 0:
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = %s",
                (queue_id,)
            )
            conn.commit()
            send_message(chat_id, f'🎨 Начинаю генерацию с {model_info["name"]}...')
        
        if is_paid:
            image_url = generate_image_paid_long(prompt, model)
            
            if image_url:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'completed', image_url = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (image_url, queue_id)
                )
                conn.commit()
                
                save_generation_history(telegram_id, prompt, model, None, image_url, is_paid)
                
                caption = f'✨ Готово!\n\nМодель: {model_info["name"]}\nЗадача #{queue_id}'
                send_photo_url(chat_id, image_url, caption, get_effects_keyboard())
                print(f'Queue {queue_id} completed (paid)')
            else:
                if retry_count < 1:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'pending', retry_count = retry_count + 1 WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    print(f'Queue {queue_id} timeout, will retry')
                else:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'Generation timeout' WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    send_message(chat_id, '❌ Генерация не завершилась за отведенное время. Попробуй упростить описание или выбери другую модель.')
        else:
            image_url = generate_image_sync(prompt, model)
            
            if image_url and image_url != 'TIMEOUT':
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'completed', image_url = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (image_url, queue_id)
                )
                conn.commit()
                
                save_generation_history(telegram_id, prompt, model, None, image_url, is_paid)
                
                caption = f'✨ Готово!\n\nМодель: {model_info["name"]}\nЗадача #{queue_id}'
                send_photo_url(chat_id, image_url, caption, get_effects_keyboard())
                print(f'Queue {queue_id} completed (sync)')
            else:
                if retry_count < 2:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'pending', retry_count = retry_count + 1 WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                else:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'Generation failed' WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    send_message(chat_id, '❌ Ошибка генерации')
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Error processing queue {queue_id}: {e}')
        if conn:
            conn.close()
        return False

def process_queue(limit: int = 5) -> Dict[str, Any]:
    '''
    Обрабатывает задачи из очереди (pending и processing с openrouter_request_id)
    '''
    print('Starting process_queue')
    conn = get_db_connection()
    if not conn:
        print('DB connection failed')
        return {'processed': 0, 'error': 'DB connection failed'}
    
    print('DB connection successful')
    
    try:
        cur = conn.cursor()
        print('Cursor created')
        
        query = "SELECT id, telegram_id, chat_id, username, first_name, prompt, model, is_paid, retry_count FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT %s"
        print(f'Executing query: {query}')
        print(f'Limit: {limit}')
        
        cur.execute(query, (limit,))
        print('Query executed')
        
        rows = cur.fetchall()
        print(f'Fetched {len(rows) if rows else 0} rows')
        
        cur.close()
        conn.close()
        
        if not rows:
            print('No tasks in queue')
            return {'processed': 0, 'pending': 0}
        
        print(f'Found {len(rows)} tasks to process')
        
        processed = 0
        for row in rows:
            item = {
                'id': row[0],
                'telegram_id': row[1],
                'chat_id': row[2],
                'username': row[3],
                'first_name': row[4],
                'prompt': row[5],
                'model': row[6],
                'is_paid': row[7],
                'retry_count': row[8] or 0
            }
            
            print(f'Processing queue item {item["id"]}')
            
            if process_queue_item(item):
                processed += 1
            
            time.sleep(1)
        
        return {'processed': processed, 'total': len(rows)}
    except Exception as e:
        import traceback
        print(f'Error in process_queue: {e}')
        print(f'Traceback: {traceback.format_exc()}')
        if conn:
            try:
                conn.close()
            except:
                pass
        return {'processed': 0, 'error': str(e)}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    print(f'Worker started: {context.request_id}')
    
    result = process_queue(limit=5)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result),
        'isBase64Encoded': False
    }