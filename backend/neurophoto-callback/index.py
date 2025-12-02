'''
Business: Webhook callback для получения результатов генерации от OpenRouter
Args: event - dict с httpMethod (POST), body с результатами генерации
      context - object с request_id
Returns: HTTP response dict
'''

import json
import os
import requests
import psycopg2
from typing import Dict, Any, Optional

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
DATABASE_URL = os.environ.get('DATABASE_URL', '')

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
        requests.post(f'{get_telegram_api()}/sendMessage', json=data, timeout=10)
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo_url(chat_id: int, image_url: str, caption: str = '', reply_markup: Optional[Dict] = None) -> None:
    try:
        if image_url.startswith('data:image'):
            import base64
            header, encoded = image_url.split(',', 1)
            image_bytes = base64.b64decode(encoded)
            
            files = {'photo': ('image.png', image_bytes, 'image/png')}
            data = {'chat_id': chat_id, 'caption': caption}
            if reply_markup:
                data['reply_markup'] = json.dumps(reply_markup)
            
            requests.post(f'{get_telegram_api()}/sendPhoto', data=data, files=files, timeout=30)
        elif image_url.startswith('http'):
            img_response = requests.get(image_url, timeout=15)
            if img_response.status_code == 200:
                files = {'photo': ('image.jpg', img_response.content, 'image/jpeg')}
                data = {'chat_id': chat_id, 'caption': caption}
                if reply_markup:
                    data['reply_markup'] = json.dumps(reply_markup)
                
                requests.post(f'{get_telegram_api()}/sendPhoto', data=data, files=files, timeout=30)
    except Exception as e:
        print(f'Error sending photo: {e}')

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

def save_generation_history(telegram_id: int, prompt: str, model: str, image_url: str, is_paid: bool) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO t_p60354232_chatbot_platform_cre.neurophoto_generations (telegram_id, prompt, model, effect, image_url, is_paid) VALUES (%s, %s, %s, %s, %s, %s)",
            (telegram_id, prompt, model, None, image_url, is_paid)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Error saving history: {e}')
        if conn:
            conn.close()
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        print(f'Received callback: {json.dumps(body)[:500]}')
        
        queue_id = body.get('metadata', {}).get('queue_id')
        if not queue_id:
            print('No queue_id in metadata')
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No queue_id'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        if not conn:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'DB error'}),
                'isBase64Encoded': False
            }
        
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT telegram_id, chat_id, prompt, model, is_paid FROM t_p60354232_chatbot_platform_cre.neurophoto_queue WHERE id = %s",
                (queue_id,)
            )
            result = cur.fetchone()
            
            if not result:
                print(f'Queue item {queue_id} not found')
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Queue not found'}),
                    'isBase64Encoded': False
                }
            
            telegram_id, chat_id, prompt, model, is_paid = result
            model_info = IMAGE_MODELS.get(model, IMAGE_MODELS['flux-schnell'])
            
            image_url = None
            if body.get('images') and len(body['images']) > 0:
                image_url = body['images'][0]
            elif body.get('choices') and len(body['choices']) > 0:
                message = body['choices'][0].get('message', {})
                if message.get('images') and len(message['images']) > 0:
                    image_data = message['images'][0]
                    if isinstance(image_data, str):
                        image_url = image_data
                    elif isinstance(image_data, dict) and image_data.get('url'):
                        image_url = image_data['url']
                
                content = message.get('content', '')
                if isinstance(content, str) and content.startswith('data:image'):
                    image_url = content
            
            if image_url:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'completed', image_url = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (image_url, queue_id)
                )
                conn.commit()
                
                save_generation_history(telegram_id, prompt, model, image_url, is_paid)
                
                caption = f'✨ Готово!\n\nМодель: {model_info["name"]}\nЗадача #{queue_id}'
                send_photo_url(chat_id, image_url, caption, get_effects_keyboard())
                
                print(f'Queue {queue_id} completed via callback')
            else:
                cur.execute(
                    "UPDATE t_p60354232_chatbot_platform_cre.neurophoto_queue SET status = 'failed', error_message = 'No image in response' WHERE id = %s",
                    (queue_id,)
                )
                conn.commit()
                send_message(chat_id, '❌ Ошибка генерации')
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        except Exception as e:
            print(f'Error processing callback: {e}')
            if conn:
                conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        print(f'Error in handler: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }