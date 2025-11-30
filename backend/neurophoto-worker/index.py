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
    'gemini-flash': {'id': 'google/gemini-2.0-flash-exp:free', 'name': '🆓 Gemini Flash', 'paid': False},
    'gemini-3-pro': {'id': 'google/gemini-3-pro-image-preview', 'name': '🎨 Gemini 3 Pro', 'paid': True},
    'gpt-5-image': {'id': 'openai/gpt-5-image', 'name': '🤖 GPT-5 Image', 'paid': True},
    'gpt-5-mini': {'id': 'openai/gpt-5-image-mini', 'name': '⚡ GPT-5 Mini', 'paid': True},
    'gemini-2.5-flash': {'id': 'google/gemini-2.5-flash-image', 'name': '🌟 Gemini 2.5 Flash', 'paid': True}
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

def start_image_generation(prompt: str, model: str = 'gemini-flash') -> Optional[str]:
    '''
    Запускает генерацию изображения и возвращает request_id для polling
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['gemini-flash'])
    model_id = model_info['id']
    
    print(f'Starting async generation with {model_info["name"]} ({model_id}): {prompt[:100]}...')
    
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
            'modalities': ['text', 'image'],
            'stream': False,
            'max_tokens': 4096
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=5
        )
        
        print(f'Start generation response: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            request_id = data.get('id')
            if request_id:
                print(f'Generation started with request_id: {request_id}')
                return request_id
        
        print(f'Failed to start generation: {response.text[:500]}')
        return None
    except Exception as e:
        print(f'Error starting generation: {e}')
        return None

def check_generation_status(request_id: str) -> Optional[str]:
    '''
    Проверяет статус генерации по request_id
    Возвращает: image_url если готово, 'PENDING' если в процессе, None если ошибка
    '''
    if not OPENROUTER_API_KEY:
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'https://openrouter.ai/api/v1/generation?id={request_id}',
            headers=headers,
            timeout=10
        )
        
        print(f'Check status response: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            
            print(f'Generation status: {status}')
            
            if status == 'completed':
                if data.get('images') and len(data['images']) > 0:
                    image_data = data['images'][0]
                    if isinstance(image_data, str):
                        return image_data
                    elif isinstance(image_data, dict) and image_data.get('url'):
                        return image_data['url']
                
                if data.get('choices') and len(data['choices']) > 0:
                    message = data['choices'][0].get('message', {})
                    
                    if message.get('images') and len(message['images']) > 0:
                        image_data = message['images'][0]
                        if isinstance(image_data, str):
                            return image_data
                        elif isinstance(image_data, dict) and image_data.get('url'):
                            return image_data['url']
                    
                    content = message.get('content', '')
                    if isinstance(content, str) and content.startswith('data:image'):
                        return content
                
                return None
            elif status in ['pending', 'processing']:
                return 'PENDING'
            else:
                print(f'Generation failed with status: {status}')
                return None
        
        return None
    except Exception as e:
        print(f'Error checking status: {e}')
        return None

def generate_image_sync(prompt: str, model: str = 'gemini-flash') -> Optional[str]:
    '''
    Синхронная генерация для бесплатных моделей (быстрые)
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['gemini-flash'])
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
            'messages': [{'role': 'user', 'content': prompt}],
            'modalities': ['text', 'image'],
            'stream': False,
            'max_tokens': 4096
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('images') and len(data['images']) > 0:
                return data['images'][0]
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                if message.get('images') and len(message['images']) > 0:
                    image_data = message['images'][0]
                    if isinstance(image_data, str):
                        return image_data
                    elif isinstance(image_data, dict) and image_data.get('url'):
                        return image_data['url']
                
                content = message.get('content', '')
                if isinstance(content, str) and content.startswith('data:image'):
                    return content
        
        elif response.status_code == 429:
            return 'TIMEOUT'
        
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
    Обрабатывает одну задачу из очереди с polling механизмом
    '''
    queue_id = item['id']
    chat_id = item['chat_id']
    telegram_id = item['telegram_id']
    prompt = item['prompt']
    model = item['model']
    is_paid = item['is_paid']
    openrouter_request_id = item.get('openrouter_request_id')
    
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['gemini-flash'])
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        if not openrouter_request_id:
            print(f'Starting new generation for queue item {queue_id}')
            
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = %s",
                (queue_id,)
            )
            conn.commit()
            
            send_message(chat_id, f'🎨 Начинаю генерацию с {model_info["name"]}...')
            
            if is_paid:
                request_id = start_image_generation(prompt, model)
                
                if request_id:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET openrouter_request_id = %s WHERE id = %s",
                        (request_id, queue_id)
                    )
                    conn.commit()
                    print(f'Queue {queue_id} started async generation: {request_id}')
                else:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'Failed to start generation' WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    send_message(chat_id, f'❌ Не удалось запустить генерацию')
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
                    cur.execute(
                        "SELECT retry_count FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE id = %s",
                        (queue_id,)
                    )
                    retry_result = cur.fetchone()
                    retry_count = retry_result[0] if retry_result else 0
                    
                    if retry_count < 2:
                        cur.execute(
                            "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'pending', retry_count = retry_count + 1 WHERE id = %s",
                            (queue_id,)
                        )
                        conn.commit()
                        print(f'Queue {queue_id} retry {retry_count + 1}')
                    else:
                        cur.execute(
                            "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'Timeout' WHERE id = %s",
                            (queue_id,)
                        )
                        conn.commit()
                        send_message(chat_id, f'❌ Ошибка генерации')
        else:
            print(f'Checking status for queue {queue_id}, request_id: {openrouter_request_id}')
            
            result = check_generation_status(openrouter_request_id)
            
            if result == 'PENDING':
                print(f'Queue {queue_id} still pending')
                pass
            elif result:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'completed', image_url = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (result, queue_id)
                )
                conn.commit()
                
                save_generation_history(telegram_id, prompt, model, None, result, is_paid)
                
                caption = f'✨ Готово!\n\nМодель: {model_info["name"]}\nЗадача #{queue_id}'
                send_photo_url(chat_id, result, caption, get_effects_keyboard())
                print(f'Queue {queue_id} completed (async)')
            else:
                cur.execute(
                    "SELECT retry_count FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE id = %s",
                    (queue_id,)
                )
                retry_result = cur.fetchone()
                retry_count = retry_result[0] if retry_result else 0
                
                if retry_count < 5:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET retry_count = retry_count + 1 WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    print(f'Queue {queue_id} check retry {retry_count + 1}')
                else:
                    cur.execute(
                        "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'Generation failed' WHERE id = %s",
                        (queue_id,)
                    )
                    conn.commit()
                    send_message(chat_id, f'❌ Ошибка генерации')
        
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
    conn = get_db_connection()
    if not conn:
        return {'processed': 0, 'error': 'DB connection failed'}
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, telegram_id, chat_id, username, first_name, prompt, model, is_paid, openrouter_request_id FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE status IN ('pending', 'processing') ORDER BY created_at ASC LIMIT %s",
            (limit,)
        )
        rows = cur.fetchall()
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
                'openrouter_request_id': row[8]
            }
            
            if process_queue_item(item):
                processed += 1
            
            time.sleep(1)
        
        return {'processed': processed, 'total': len(rows)}
    except Exception as e:
        print(f'Error in process_queue: {e}')
        if conn:
            conn.close()
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