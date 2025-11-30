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

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')

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
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=90
        )
        
        print(f'OpenRouter API response: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('images') and len(data['images']) > 0:
                image_data = data['images'][0]
                print(f'Image generated successfully (base64): {image_data[:100]}...')
                return image_data
            
            if data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                
                if message.get('images'):
                    image_data = message['images'][0]
                    print(f'Image generated successfully from message.images: {image_data[:100]}...')
                    return image_data
                
                content = message.get('content', '')
                if isinstance(content, str) and content.startswith('data:image'):
                    print(f'Image generated successfully from content: {content[:100]}...')
                    return content
        else:
            print(f'OpenRouter API error: {response.status_code}, {response.text[:500]}')
        
        return None
    except Exception as e:
        print(f'OpenRouter API error: {e}')
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
    Обрабатывает одну задачу из очереди
    '''
    queue_id = item['id']
    chat_id = item['chat_id']
    telegram_id = item['telegram_id']
    prompt = item['prompt']
    model = item['model']
    is_paid = item['is_paid']
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = %s",
            (queue_id,)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        print(f'Processing queue item {queue_id}: model={model}, prompt={prompt[:50]}...')
        
        model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['gemini-flash'])
        send_message(chat_id, f'🎨 Начинаю генерацию с {model_info["name"]}...')
        
        image_url = generate_image(prompt, model)
        
        conn = get_db_connection()
        if not conn:
            return False
        
        cur = conn.cursor()
        
        if image_url:
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'completed', image_url = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (image_url, queue_id)
            )
            conn.commit()
            
            save_generation_history(telegram_id, prompt, model, None, image_url, is_paid)
            
            caption = f'✨ Готово!\n\nМодель: {model_info["name"]}\nЗадача #{queue_id}'
            send_photo_url(chat_id, image_url, caption, get_effects_keyboard())
            send_message(chat_id, '🎨 *Хочешь добавить эффекты?*\n\nВыбери эффект для улучшения изображения или создай новое фото:')
            
            print(f'Queue item {queue_id} completed successfully')
        else:
            error_msg = 'Не удалось сгенерировать изображение'
            cur.execute(
                "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (error_msg, queue_id)
            )
            conn.commit()
            
            send_message(chat_id, f'❌ Ошибка генерации изображения (задача #{queue_id})\n\nПопробуй:\n• Другую модель\n• Упрости описание\n• Напиши /start для нового запроса')
            
            print(f'Queue item {queue_id} failed')
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Error processing queue item {queue_id}: {e}')
        
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = %s WHERE id = %s",
                    (str(e), queue_id)
                )
                conn.commit()
                cur.close()
                conn.close()
            except:
                pass
        
        return False

def process_queue(limit: int = 5) -> Dict[str, Any]:
    '''
    Обрабатывает задачи из очереди
    '''
    conn = get_db_connection()
    if not conn:
        return {'processed': 0, 'error': 'DB connection failed'}
    
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, telegram_id, chat_id, username, first_name, prompt, model, is_paid FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT %s",
            (limit,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        if not rows:
            print('No pending tasks in queue')
            return {'processed': 0, 'pending': 0}
        
        print(f'Found {len(rows)} pending tasks')
        
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
                'is_paid': row[7]
            }
            
            if process_queue_item(item):
                processed += 1
            
            time.sleep(2)
        
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