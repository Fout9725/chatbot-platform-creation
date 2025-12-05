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
    'gemini-flash': {'id': 'google/gemini-2.0-flash-exp:free', 'name': '🆓 Gemini Flash', 'paid': False},
    'flux-schnell': {'id': 'black-forest-labs/flux-schnell-free', 'name': '🆓 FLUX Schnell', 'paid': False},
    'stable-diffusion': {'id': 'stability-ai/stable-diffusion-xl', 'name': '🆓 Stable Diffusion XL', 'paid': False},
    'flux-pro': {'id': 'black-forest-labs/flux-pro', 'name': '🎨 FLUX Pro', 'paid': True},
    'gemini-2.5-flash': {'id': 'google/gemini-2.5-flash-image-preview', 'name': '⚡ Nano Banana', 'paid': True},
    'nano-banana-pro': {'id': 'google/gemini-3-pro-image-preview', 'name': '💎 Nano Banana Pro', 'paid': True},
    'gpt-5-image': {'id': 'openai/gpt-5-image', 'name': '🤖 GPT-5 Image', 'paid': True}
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
                'content': prompt
            }],
            'modalities': ['image', 'text'],  # image + text для генерации изображений
            'stream': False,
            'max_tokens': 4096
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=90  # Увеличиваем таймаут до 90 секунд для медленных моделей
        )
        
        print(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'API response keys: {list(data.keys())}')
            
            # Проверяем на ошибку внутри успешного ответа
            if data.get('error'):
                error_msg = data['error'].get('message', 'Unknown error')
                print(f'OpenRouter API internal error: {error_msg}')
                return None
            
            # Проверяем поле images (base64 data URLs)
            if data.get('images') and len(data['images']) > 0:
                image_data = data['images'][0]
                print(f'Image generated successfully (base64)')
                return image_data
            
            # Проверяем choices[0].message для альтернативных форматов
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                # Проверяем поле images в message
                if message.get('images') and len(message['images']) > 0:
                    image_data = message['images'][0]
                    if isinstance(image_data, str):
                        print(f'Found image in message.images (string)')
                        return image_data
                    elif isinstance(image_data, dict):
                        url = image_data.get('image_url', {}).get('url') or image_data.get('url')
                        if url:
                            print(f'Found image in message.images (dict)')
                            return url
                
                # Проверяем content
                content = message.get('content', '')
                if isinstance(content, str) and content.startswith('data:image'):
                    print(f'Found image in content (string)')
                    return content
                
                # Проверяем, если content - это массив с изображениями
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'image_url':
                            img_url = item.get('image_url', {}).get('url')
                            if img_url:
                                print(f'Found image in content array')
                                return img_url
            
            print(f'!!! NO IMAGE IN RESPONSE !!!')
            print(f'Full response: {json.dumps(data, indent=2, default=str)[:1000]}')
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

def generate_image_paid_long_with_image(prompt: str, model: str, image_url: str) -> Optional[str]:
    '''
    Генерация платной модели с редактированием изображения
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
    model_id = model_info['id']
    
    print(f'Paid generation with image editing {model_info["name"]}: {prompt[:50]}...')
    
    if not OPENROUTER_API_KEY:
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'NeurophotoBot'
        }
        
        # Создаем content с изображением и текстом
        content = [
            {'type': 'image_url', 'image_url': {'url': image_url}},
            {'type': 'text', 'text': f'{prompt}\n\nIMPORTANT: You MUST generate and return an image, not text description. Return only the generated image.'}
        ]
        
        payload = {
            'model': model_id,
            'messages': [{
                'role': 'user',
                'content': content
            }],
            'modalities': ['image', 'text'],  # image + text для генерации изображений
            'stream': False,
            'max_tokens': 4096
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=90
        )
        
        print(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'API response keys: {list(data.keys())}')
            
            # Проверяем на ошибку
            if data.get('error'):
                error_msg = data['error'].get('message', 'Unknown error')
                print(f'OpenRouter API internal error: {error_msg}')
                return None
            
            # Проверяем все возможные места где может быть изображение
            if data.get('images'):
                return data['images'][0]
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                if message.get('images'):
                    image_data = message['images'][0]
                    if isinstance(image_data, str):
                        return image_data
                    elif isinstance(image_data, dict):
                        url = image_data.get('image_url', {}).get('url') or image_data.get('url')
                        if url:
                            return url
                
                content_resp = message.get('content', '')
                if isinstance(content_resp, str) and content_resp.startswith('data:image'):
                    return content_resp
                
                if isinstance(content_resp, list):
                    for item in content_resp:
                        if isinstance(item, dict) and item.get('type') == 'image_url':
                            url = item.get('image_url', {}).get('url')
                            if url:
                                return url
            
            print(f'!!! NO IMAGE IN RESPONSE !!!')
        else:
            error_text = response.text[:500] if response.text else 'No error message'
            print(f'OpenRouter error: {error_text}')
        
        return None
    except requests.exceptions.Timeout:
        print(f'Timeout after 90s')
        return None
    except Exception as e:
        print(f'Error: {e}')
        return None

def generate_image_paid_long_multi(prompt: str, model: str, photo_urls: list) -> Optional[str]:
    '''
    Генерация платной модели с редактированием НЕСКОЛЬКИХ изображений
    Отправляет все фото в одном запросе
    '''
    model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
    model_id = model_info['id']
    
    print(f'Paid generation with {len(photo_urls)} images using {model_info["name"]}: {prompt[:50]}...')
    
    if not OPENROUTER_API_KEY:
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'NeurophotoBot'
        }
        
        # Создаем content с несколькими изображениями и текстом
        content = []
        for url in photo_urls:
            content.append({'type': 'image_url', 'image_url': {'url': url}})
        
        content.append({
            'type': 'text',
            'text': f'You are an expert photo editor. I will show you {len(photo_urls)} images and you need to COMBINE and MODIFY them according to my instructions.\n\nYour task:\n1. Analyze all {len(photo_urls)} images I provided\n2. Combine them creatively into ONE image\n3. Apply these specific changes: {prompt}\n4. Return the MODIFIED combined version\n\nIMPORTANT RULES:\n- You MUST use ALL images provided\n- Combine them in a natural, creative way\n- Apply the changes SIGNIFICANTLY and OBVIOUSLY\n- The result should be ONE cohesive image\n- RETURN ONLY THE IMAGE, not text description\n\nNow, combine and modify the images according to this instruction: {prompt}'
        })
        
        payload = {
            'model': model_id,
            'messages': [{
                'role': 'user',
                'content': content
            }],
            'modalities': ['image', 'text'],
            'stream': False,
            'max_tokens': 4096
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=90
        )
        
        print(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'API response keys: {list(data.keys())}')
            
            # Логируем полный ответ для отладки
            import json as json_module
            print(f'=== FULL RESPONSE (MULTI) ===')
            print(json_module.dumps(data, indent=2, default=str)[:1000])
            print(f'=== END ===')
            
            # Проверяем на ошибку
            if data.get('error'):
                error_msg = data['error'].get('message', 'Unknown error')
                print(f'OpenRouter API internal error: {error_msg}')
                return None
            
            # Проверяем все возможные места где может быть изображение
            if data.get('images'):
                print(f'Found image in root images field')
                return data['images'][0]
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                if message.get('images'):
                    image_data = message['images'][0]
                    if isinstance(image_data, str):
                        print(f'Found image in message.images (string)')
                        return image_data
                    elif isinstance(image_data, dict):
                        url = image_data.get('image_url', {}).get('url') or image_data.get('url')
                        if url:
                            print(f'Found image in message.images (dict)')
                            return url
                
                content_resp = message.get('content', '')
                if isinstance(content_resp, str) and content_resp.startswith('data:image'):
                    print(f'Found image in content (string)')
                    return content_resp
                
                if isinstance(content_resp, list):
                    for item in content_resp:
                        if isinstance(item, dict) and item.get('type') == 'image_url':
                            url = item.get('image_url', {}).get('url')
                            if url:
                                print(f'Found image in content array')
                                return url
            
            print(f'!!! NO IMAGE IN RESPONSE (multi) !!!')
        else:
            print(f'API error: {response.status_code} - {response.text[:200]}')
        
        return None
    except requests.exceptions.Timeout:
        print(f'Timeout after 90s (multi)')
        return None
    except Exception as e:
        print(f'Error (multi): {e}')
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
        
        # Парсим prompt - если это JSON, значит есть photo_url для редактирования
        photo_url_to_edit = None
        photo_urls_list = None
        is_multiple = False
        actual_prompt = prompt
        
        try:
            prompt_data = json.loads(prompt)
            if isinstance(prompt_data, dict):
                actual_prompt = prompt_data.get('prompt', prompt)
                photo_url_data = prompt_data.get('photo_url')
                is_multiple = prompt_data.get('is_multiple', False)
                
                if photo_url_data:
                    if is_multiple:
                        photo_urls_list = photo_url_data.split(',')
                    else:
                        photo_url_to_edit = photo_url_data
        except:
            # Если не JSON, используем prompt как есть
            pass
        
        if retry_count == 0:
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = %s",
                (queue_id,)
            )
            conn.commit()
            send_message(chat_id, f'🎨 Начинаю генерацию с {model_info["name"]}...')
        
        if is_paid:
            # Для редактирования фото используем специальный формат с image_url в content
            if photo_urls_list:
                # Множественные фото - используем функцию для multi-image
                image_url = generate_image_paid_long_multi(actual_prompt, model, photo_urls_list)
            elif photo_url_to_edit:
                # Одно фото - редактирование
                image_url = generate_image_paid_long_with_image(actual_prompt, model, photo_url_to_edit)
            else:
                # Обычная генерация из текста
                image_url = generate_image_paid_long(actual_prompt, model)
            
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