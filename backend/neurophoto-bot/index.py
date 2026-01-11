import json
import os
import base64
from typing import Dict, Any, Optional, List
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

ADMIN_IDS = [285675692]  # Список ID администраторов
DB_SCHEMA = 't_p60354232_chatbot_platform_cre'  # Схема БД
# v3.14 - Detailed logging for GPT-5 Image S3 upload timeout

IMAGE_MODELS = {
    'free': [
        {
            'id': 'nvidia/nemotron-nano-12b-v2-vl:free',
            'name': 'Nemotron Nano',
            'emoji': '🟢',
            'info': 'Компактная vision-модель от NVIDIA. Отлично понимает изображения и текст.'
        },
        {
            'id': 'google/gemma-3-27b-it:free',
            'name': 'Gemma 3',
            'emoji': '💚',
            'info': 'Мощная модель Google для сложных задач. Высокая точность генерации.'
        },
        {
            'id': 'google/gemini-2.0-flash-exp:free',
            'name': 'Gemini Flash',
            'emoji': '⚡',
            'info': 'Быстрая генерация от Google. Скорость + качество.'
        },
        {
            'id': 'mistralai/mistral-small-3.1-24b-instruct:free',
            'name': 'Mistral Small',
            'emoji': '🔵',
            'info': 'Эффективная модель от Mistral AI. Точно следует инструкциям.'
        }
    ],
    'paid': [
        {
            'id': 'google/gemini-3-pro-image-preview',
            'name': 'Gemini 3 Pro',
            'emoji': '💎',
            'info': 'Топовая модель Google для профессиональной генерации изображений.'
        },
        {
            'id': 'google/gemini-2.5-flash-image',
            'name': 'Gemini 2.5 Flash',
            'emoji': '⚡',
            'info': 'Быстрая Pro-версия с расширенными возможностями обработки.'
        },
        {
            'id': 'black-forest-labs/flux.2-flex',
            'name': 'FLUX 2 Flex',
            'emoji': '🌟',
            'info': 'Гибкая генерация любых стилей. От реализма до арта.'
        },
        {
            'id': 'black-forest-labs/flux.2-pro',
            'name': 'FLUX 2 Pro',
            'emoji': '💫',
            'info': 'Профессиональная FLUX модель. Максимальное качество и детализация.'
        },
        {
            'id': 'openai/gpt-5-image',
            'name': 'GPT-5 Image',
            'emoji': '🎨',
            'info': 'Новейшая модель OpenAI. Революционное качество генерации.'
        }
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
    
    print(f"[TELEGRAM] Sending photo to chat {chat_id}")
    print(f"[TELEGRAM] Photo URL: {photo_url}")
    print(f"[TELEGRAM] Caption length: {len(caption)}")
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"[TELEGRAM] Response: {json.dumps(result, ensure_ascii=False)[:500]}")
            return result.get('ok', False)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[ERROR] Telegram API error {e.code}: {error_body}")
        return False
    except Exception as e:
        print(f"[ERROR] Send photo exception: {type(e).__name__}: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def get_telegram_file_url(bot_token: str, file_id: str) -> Optional[str]:
    '''Получение URL файла из Telegram'''
    try:
        # Получаем информацию о файле
        get_file_url = f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}'
        req = urllib.request.Request(get_file_url)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('ok'):
                file_path = result['result']['file_path']
                # Формируем URL для скачивания файла
                download_url = f'https://api.telegram.org/file/bot{bot_token}/{file_path}'
                return download_url
            return None
    except Exception as e:
        print(f"[ERROR] Get file URL: {e}")
        return None

def answer_callback_query(bot_token: str, callback_query_id: str, text: str = '', show_alert: bool = False) -> bool:
    '''Ответ на callback query для убирания "загрузки" на кнопке'''
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

def generate_image_openrouter(prompt: str, model: str, image_urls: List[str] = None) -> Optional[str]:
    '''Генерация изображения через OpenRouter API'''
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        print("[ERROR] No OPENROUTER_API_KEY")
        return None
    
    url = 'https://openrouter.ai/api/v1/chat/completions'
    
    # Определяем, является ли модель image generation моделью
    image_gen_models = [
        'google/gemini-3-pro-image-preview',
        'google/gemini-2.5-flash-image',
        'black-forest-labs/flux.2-flex',
        'black-forest-labs/flux.2-pro',
        'openai/gpt-5-image'
    ]
    
    is_image_gen = model in image_gen_models
    
    # CRITICAL: Для gemini-3-pro и gemini-2.5-flash с изображениями используем специальный формат
    gemini_models = ['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image']
    is_gemini = model in gemini_models
    
    # Формируем content для сообщения
    content = []
    
    # CRITICAL: Для Gemini с фото - добавляем текст ПЕРЕД изображениями
    if image_urls and is_gemini:
        print(f"[OPENROUTER] Gemini mode: Adding prompt before {len(image_urls)} images")
        # Сначала промпт
        content.append({'type': 'text', 'text': f"{prompt}\n\nСоздай изображение на основе этих примеров:"})
        # Потом изображения
        for img_url in image_urls:
            content.append({
                'type': 'image_url',
                'image_url': {'url': img_url}
            })
    elif image_urls:
        # Для остальных vision моделей - стандартный порядок
        print(f"[OPENROUTER] Standard vision mode: Adding {len(image_urls)} images")
        for img_url in image_urls:
            content.append({
                'type': 'image_url',
                'image_url': {'url': img_url}
            })
        content.append({'type': 'text', 'text': prompt})
    else:
        # Только текст - генерация без примеров
        print(f"[OPENROUTER] Text-only generation mode")
        content.append({'type': 'text', 'text': prompt})
    
    # Формируем запрос в зависимости от типа модели
    # CRITICAL: Для генерации изображений нужно МНОГО токенов (base64 изображения очень длинные)
    max_tokens = 16000 if is_image_gen else 1000
    
    request_body = {
        'model': model,
        'messages': [{
            'role': 'user',
            'content': content
        }],
        'max_tokens': max_tokens
    }
    
    # CRITICAL: Для Gemini image generation моделей ВСЕГДА добавляем modalities
    # Это указывает API что нужно вернуть изображение в поле message.images
    if is_image_gen:
        print(f"[OPENROUTER] Adding modalities=['image'] for image generation model")
        request_body['modalities'] = ['image']  # Только 'image' для генерации изображений
    
    print(f"[OPENROUTER] ===== REQUEST DEBUG =====")
    print(f"[OPENROUTER] Model: {model}")
    print(f"[OPENROUTER] Is image gen: {is_image_gen}")
    print(f"[OPENROUTER] Has images: {bool(image_urls)}")
    print(f"[OPENROUTER] Images count: {len(image_urls) if image_urls else 0}")
    print(f"[OPENROUTER] Request body keys: {list(request_body.keys())}")
    print(f"[OPENROUTER] Content items: {len(content)}")
    for i, item in enumerate(content):
        if item.get('type') == 'text':
            print(f"[OPENROUTER]   [{i}] text: {item['text'][:100]}")
        elif item.get('type') == 'image_url':
            print(f"[OPENROUTER]   [{i}] image_url: {item['image_url']['url'][:100]}")
    
    data = json.dumps(request_body).encode('utf-8')
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://poehali.dev',
        'X-Title': 'Neurophoto Bot'
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    print(f"[OPENROUTER] Sending request to OpenRouter...")
    print(f"[OPENROUTER] Request size: {len(data)} bytes")
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            print(f"[OPENROUTER] Got response! Status: {response.status}")
            response_body = response.read().decode('utf-8')
            print(f"[OPENROUTER] Response size: {len(response_body)} bytes")
            
            # CRITICAL: Для GPT-5 логируем RAW ответ до парсинга
            if 'gpt-5-image' in model:
                print(f"[GPT5-DEBUG] Raw response (first 2000 chars): {response_body[:2000]}")
            
            result = json.loads(response_body)
            
            # CRITICAL: Выводим ПОЛНЫЙ ответ для диагностики (без огромных base64)
            print(f"[OPENROUTER] Response keys: {list(result.keys())}")
            print(f"[OPENROUTER] Choices count: {len(result.get('choices', []))}")
            
            # Выводим весь ответ, но ограничиваем размер каждого поля
            result_debug = {}
            for key, val in result.items():
                if isinstance(val, str) and len(val) > 500:
                    result_debug[key] = f"{val[:500]}... (truncated, total {len(val)} chars)"
                else:
                    result_debug[key] = val
            print(f"[OPENROUTER] Full response: {json.dumps(result_debug, ensure_ascii=False, indent=2)}")
            
            # Проверяем наличие choices
            if 'choices' not in result or len(result['choices']) == 0:
                print(f"[ERROR] No choices in response")
                return None
            
            message = result['choices'][0].get('message', {})
            print(f"[OPENROUTER] Message keys: {list(message.keys())}")
            
            # CRITICAL: Check for refusal first (model rejected the request)
            if 'refusal' in message and message['refusal']:
                print(f"[ERROR] Model refused the request: {message['refusal']}")
                return None
            
            content = message.get('content', '')
            print(f"[OPENROUTER] Content type: {type(content).__name__}")
            if isinstance(content, str):
                print(f"[OPENROUTER] Content length: {len(content)} chars")
                if len(content) > 0:
                    print(f"[OPENROUTER] Content preview: {content[:100]}...")
            elif isinstance(content, dict):
                print(f"[OPENROUTER] Content dict keys: {list(content.keys())}")
            elif isinstance(content, list):
                print(f"[OPENROUTER] Content list length: {len(content)}")
            
            # ===== STRATEGY 1: Check 'images' field in message (PRIMARY FOR IMAGE GENERATION) =====
            # CRITICAL: Gemini 3 Pro и другие модели генерации изображений возвращают массив изображений
            if 'images' in message:
                images = message['images']
                print(f"[OPENROUTER] ✅ Found 'images' field: {type(images).__name__}")
                
                if isinstance(images, list) and len(images) > 0:
                    first_image = images[0]
                    print(f"[OPENROUTER] ✅ Returning first image from list (type: {type(first_image).__name__}, size: {len(str(first_image))} chars)")
                    return first_image
                elif isinstance(images, str):
                    print(f"[OPENROUTER] ✅ Returning images string (size: {len(images)} chars)")
                    return images
                else:
                    print(f"[OPENROUTER] ⚠️ Unexpected images type: {type(images).__name__}")
            else:
                print(f"[OPENROUTER] No 'images' field in message")
            
            # ===== STRATEGY 2: Check content as list (structured content with image_url) =====
            if isinstance(content, list):
                print(f"[OPENROUTER] Content is list with {len(content)} items")
                for i, item in enumerate(content):
                    if isinstance(item, dict):
                        if item.get('type') == 'image_url':
                            img_url = item.get('image_url', {}).get('url', '')
                            if img_url:
                                print(f"[OPENROUTER] ✅ Found image_url in list item {i}")
                                return img_url
                        if 'url' in item:
                            print(f"[OPENROUTER] ✅ Found url in list item {i}")
                            return item['url']
            
            # ===== STRATEGY 3: Check content as dict (structured response) =====
            elif isinstance(content, dict):
                print(f"[OPENROUTER] Content is dict")
                if 'url' in content:
                    print(f"[OPENROUTER] ✅ Found url in dict")
                    return content['url']
                if 'data' in content:
                    print(f"[OPENROUTER] ✅ Found data in dict")
                    return content['data']
                if 'image_url' in content:
                    img_data = content['image_url']
                    if isinstance(img_data, dict) and 'url' in img_data:
                        print(f"[OPENROUTER] ✅ Found nested image_url.url")
                        return img_data['url']
                    elif isinstance(img_data, str):
                        print(f"[OPENROUTER] ✅ Found image_url as string")
                        return img_data
            
            # ===== STRATEGY 4: Check content as string (base64 or URL) =====
            elif isinstance(content, str):
                if 'data:image' in content:
                    print(f"[OPENROUTER] Found 'data:image' in content")
                    start = content.find('data:image')
                    end = start
                    for end_char in ['"', "'", ' ', '\n', ')', '}']:
                        pos = content.find(end_char, start + 20)
                        if pos != -1:
                            end = pos
                            break
                    if end == start:
                        end = len(content)
                    base64_data = content[start:end].strip()
                    print(f"[OPENROUTER] Extracted base64 data (length: {len(base64_data)})")
                    return base64_data
                
                if content.startswith('iVBOR') or content.startswith('/9j/') or content.startswith('R0lGOD'):
                    print(f"[OPENROUTER] Found raw base64 image")
                    # Добавляем data URI схему
                    if content.startswith('iVBOR'):
                        return f"data:image/png;base64,{content}"
                    elif content.startswith('/9j/'):
                        return f"data:image/jpeg;base64,{content}"
                    else:
                        return f"data:image/gif;base64,{content}"
                
                if 'https://' in content:
                    print(f"[OPENROUTER] ✅ Found HTTPS URL in content")
                    start = content.find('https://')
                    end = content.find(')', start)
                    if end == -1:
                        end = content.find(' ', start)
                    if end == -1:
                        end = content.find('\n', start)
                    if end == -1:
                        end = len(content)
                    image_url = content[start:end].strip()
                    print(f"[OPENROUTER] Extracted URL: {image_url[:100]}")
                    return image_url
            
            # Последняя попытка - вывести полную структуру для диагностики
            print(f"[ERROR] ❌ No image found in response!")
            print(f"[ERROR] Message keys: {list(message.keys())}")
            print(f"[ERROR] Content type: {type(content).__name__}")
            if isinstance(content, str):
                print(f"[ERROR] Content preview: {content[:200]}")
            
            # CRITICAL: Проверяем все возможные поля где может быть изображение
            for key in message.keys():
                if key not in ['role', 'content', 'refusal']:
                    val = message[key]
                    print(f"[ERROR] Field '{key}': type={type(val).__name__}, value={str(val)[:100]}")
            
            return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[ERROR] OpenRouter API error {e.code}: {error_body}")
        try:
            error_json = json.loads(error_body)
            print(f"[ERROR] Parsed error: {json.dumps(error_json, indent=2, ensure_ascii=False)}")
        except:
            pass
        return None
    except Exception as e:
        print(f"[ERROR] Generate image exception: {type(e).__name__}: {e}")
        import traceback
        print(traceback.format_exc())
        return None

def upload_to_s3(image_url: str, telegram_id: int) -> Optional[str]:
    '''Загрузка изображения в S3 для постоянного хранения'''
    try:
        print(f"[S3] ===== UPLOAD START =====")
        print(f"[S3] URL type: {'data:image' if image_url.startswith('data:image') else 'http(s) URL'}")
        print(f"[S3] URL length: {len(image_url)} chars")
        print(f"[S3] URL preview: {image_url[:150]}")
        
        # Проверяем, является ли изображение base64 data URL
        if image_url.startswith('data:image'):
            print("[S3] Processing base64 data URL")
            # Формат: data:image/png;base64,iVBORw0KG...
            header, encoded = image_url.split(',', 1)
            print(f"[S3] Base64 length: {len(encoded)} chars")
            image_data = base64.b64decode(encoded)
            print(f"[S3] Decoded image size: {len(image_data)} bytes")
        else:
            print(f"[S3] Downloading from external URL...")
            req = urllib.request.Request(image_url)
            print(f"[S3] Starting urllib.request.urlopen with timeout=60...")
            with urllib.request.urlopen(req, timeout=60) as response:
                print(f"[S3] Connected! Status: {response.status}")
                print(f"[S3] Reading response body...")
                image_data = response.read()
                print(f"[S3] Downloaded {len(image_data)} bytes")
        
        print(f"[S3] Creating boto3 client...")
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        key = f'neurophoto/{telegram_id}/{os.urandom(8).hex()}.png'
        print(f"[S3] Uploading to S3: {key}")
        print(f"[S3] Data size: {len(image_data)} bytes")
        s3.put_object(Bucket='files', Key=key, Body=image_data, ContentType='image/png')
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        print(f"[S3] ===== UPLOAD SUCCESS ===== {cdn_url}")
        return cdn_url
    except Exception as e:
        print(f"[ERROR] Upload to S3: {e}")
        import traceback
        print(traceback.format_exc())
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
    '''Telegram бот для генерации AI-изображений (Нейрофотосессия) v3.14'''
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
        print(f"[WEBHOOK] Method: {method}")
        print(f"[WEBHOOK] Event keys: {list(event.keys())}")
        print(f"[WEBHOOK] Body length: {len(body_str)}")
        print(f"[WEBHOOK] Full body: {body_str}")
        
        update = json.loads(body_str)
        print(f"[WEBHOOK] Update keys: {list(update.keys())}")
        print(f"[WEBHOOK] Has callback_query: {'callback_query' in update}")
        print(f"[WEBHOOK] Has message: {'message' in update}")
        
        bot_token = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
        db_url = os.environ.get('DATABASE_URL')
        
        if not db_url:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Обработка callback кнопок
        if 'callback_query' in update:
            print("[CALLBACK] ========== CALLBACK QUERY DETECTED ==========")
            try:
                callback = update['callback_query']
                print(f"[CALLBACK] Full callback object: {callback}")
                
                chat_id = str(callback['message']['chat']['id'])
                telegram_id = callback['from']['id']
                username = callback['from'].get('username', '')
                first_name = callback['from'].get('first_name', '')
                callback_query_id = callback['id']
                data = callback['data']
                
                print(f"[CALLBACK] START: User {telegram_id} (@{username}) pressed: {data}")
                
                # Ответить на callback query (убирает "загрузку" на кнопке)
                answer_result = answer_callback_query(bot_token, callback_query_id)
                print(f"[CALLBACK] Answer result: {answer_result}")
                
                # Создать пользователя если не существует
                print(f"[CALLBACK] Creating/updating user {telegram_id}")
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
                    f"ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name",
                    (telegram_id, username, first_name)
                )
                conn.commit()
                print("[CALLBACK] User created/updated")
                
                if data == 'tier:free':
                    print("[CALLBACK] Showing free models keyboard")
                    keyboard = get_model_keyboard('free')
                    print(f"[CALLBACK] Keyboard generated: {keyboard}")
                    result = send_telegram_message(bot_token, chat_id, '🆓 <b>Бесплатные модели:</b>\n\nВыберите модель:', keyboard)
                    print(f"[CALLBACK] Message sent: {result}")
                
                elif data == 'tier:paid':
                    print("[CALLBACK] Checking paid status")
                    cur.execute(f"SELECT paid_generations FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s", (telegram_id,))
                    user = cur.fetchone()
                    is_paid = user and user['paid_generations'] > 0 if user else False
                    
                    print(f"[CALLBACK] User paid status: {is_paid}, paid_generations: {user['paid_generations'] if user else 'None'}")
                    
                    if not is_paid:
                        result = send_telegram_message(bot_token, chat_id, 
                            '💎 <b>Pro модели доступны только по подписке</b>\n\n'
                            '<b>Нейрофотосессия PRO - 299₽/мес</b>\n\n'
                            '✅ Gemini 3 Pro - топовая модель Google\n'
                            '✅ FLUX 2 Pro - максимальное качество\n'
                            '✅ GPT-5 Image - новейшая от OpenAI\n'
                            '✅ Неограниченные генерации\n'
                            '✅ Приоритетная обработка\n\n'
                            'Для оплаты напишите: /pay'
                        )
                        print(f"[CALLBACK] Subscription message sent: {result}")
                    else:
                        keyboard = get_model_keyboard('paid')
                        print(f"[CALLBACK] Paid keyboard generated: {keyboard}")
                        result = send_telegram_message(bot_token, chat_id, '💎 <b>Pro модели:</b>\n\nВыберите модель:', keyboard)
                        print(f"[CALLBACK] Paid models message sent: {result}")
                
                elif data.startswith('model:'):
                    model_id = data.split(':', 1)[1]
                    print(f"[CALLBACK] Setting model: {model_id}")
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET preferred_model = %s WHERE telegram_id = %s", (model_id, telegram_id))
                    conn.commit()
                    
                    all_models = IMAGE_MODELS['free'] + IMAGE_MODELS['paid']
                    selected_model = next((m for m in all_models if m['id'] == model_id), None)
                    
                    if selected_model:
                        model_text = (
                            f"✅ <b>Модель выбрана:</b> {selected_model['emoji']} {selected_model['name']}\n\n"
                            f"ℹ️ {selected_model['info']}\n\n"
                            f"Теперь просто отправьте описание изображения!"
                        )
                        result = send_telegram_message(bot_token, chat_id, model_text)
                    else:
                        result = send_telegram_message(bot_token, chat_id, f"✅ Модель изменена\n\nТеперь просто отправьте описание изображения!")
                    print(f"[CALLBACK] Model changed message sent: {result}")
                
                elif data == 'back':
                    print("[CALLBACK] Back to main menu")
                    result = send_telegram_message(bot_token, chat_id, 'Главное меню. Напишите /help для справки.')
                    print(f"[CALLBACK] Back message sent: {result}")
                
                print(f"[CALLBACK] END: Successfully processed {data}")
                
            except Exception as callback_error:
                print(f"[CALLBACK ERROR] {type(callback_error).__name__}: {str(callback_error)}")
                import traceback
                print(traceback.format_exc())
            finally:
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
        message_text = message.get('text', '') or message.get('caption', '')
        
        # Извлекаем фотографии из сообщения
        photo_urls = []
        media_group_id = message.get('media_group_id')
        file_url = None
        
        # CRITICAL: Для media group НЕ добавляем в photo_urls сразу, только получаем URL для сохранения
        if 'photo' in message:
            print(f"[MESSAGE] Found {len(message['photo'])} photo sizes")
            # Берем самое большое фото (последнее в массиве)
            largest_photo = message['photo'][-1]
            file_url = get_telegram_file_url(bot_token, largest_photo['file_id'])
            if file_url:
                # Если это НЕ media group, тогда добавляем в photo_urls
                if not media_group_id:
                    photo_urls.append(file_url)
                print(f"[MESSAGE] Photo URL: {file_url}, media_group: {media_group_id or 'None'}")
        
        # CRITICAL: Обработка media group - используем generation_id для предотвращения дублей
        generation_id = None
        
        # Если это часть медиа-группы (несколько фото), сохраняем в БД
        if media_group_id and file_url:
            print(f"[MESSAGE] Media group detected: {media_group_id}, caption: '{message_text}'")
            generation_id = media_group_id  # Используем media_group_id как уникальный ID генерации
            
            try:
                # Создаем пользователя если не существует
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
                    f"ON CONFLICT (telegram_id) DO NOTHING",
                    (telegram_id, username, first_name)
                )
                
                # Сохраняем фото в сессию пользователя
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
                print(f"[MESSAGE] Photo saved to session")
                
                # Если есть caption (текст к фото), значит это последнее фото - обрабатываем
                if message_text:
                    print(f"[MESSAGE] Caption found in media group, checking if already processed...")
                    
                    # CRITICAL: Проверяем, не обработали ли мы уже этот media_group_id
                    cur.execute(
                        f"SELECT COUNT(*) as count FROM {DB_SCHEMA}.neurophoto_generations "
                        f"WHERE telegram_id = %s AND prompt = %s AND created_at > NOW() - INTERVAL '2 minutes'",
                        (telegram_id, f"media_group:{media_group_id}")
                    )
                    already_processed = cur.fetchone()['count'] > 0
                    
                    if already_processed:
                        print(f"[MESSAGE] Media group {media_group_id} already processed, skipping duplicate")
                        cur.close()
                        conn.close()
                        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                    
                    print(f"[MESSAGE] Processing media group {media_group_id} for the first time")
                    
                    # CRITICAL: СРАЗУ записываем маркер обработки ПЕРЕД генерацией, чтобы блокировать дубликаты
                    print(f"[MESSAGE] Creating processing marker to prevent duplicates")
                    cur.execute(
                        f"INSERT INTO {DB_SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) "
                        f"VALUES (%s, %s, %s, %s, %s)",
                        (telegram_id, f"media_group:{media_group_id}", 'processing', 'pending', False)
                    )
                    conn.commit()
                    print(f"[MESSAGE] Processing marker created, loading photos from session")
                    
                    cur.execute(
                        f"SELECT session_photo_url FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s",
                        (telegram_id,)
                    )
                    session = cur.fetchone()
                    if session and session['session_photo_url']:
                        # Filter out empty strings from split
                        photo_urls = [url for url in session['session_photo_url'].split('|') if url.strip()]
                        print(f"[MESSAGE] Loaded {len(photo_urls)} photos from session")
                        print(f"[MESSAGE] Proceeding to SINGLE generation with {len(photo_urls)} photos")
                        # Очищаем сессию
                        cur.execute(
                            f"UPDATE {DB_SCHEMA}.neurophoto_users SET "
                            f"session_state = NULL, session_photo_url = NULL, session_photo_prompt = NULL "
                            f"WHERE telegram_id = %s",
                            (telegram_id,)
                        )
                        conn.commit()
                        # Не возвращаем - продолжаем к генерации
                    else:
                        print(f"[WARNING] Caption found but no photos in session")
                        cur.close()
                        conn.close()
                        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                else:
                    # Нет caption - ждем следующее фото
                    print(f"[MESSAGE] No caption yet, waiting for more photos in media group")
                    cur.close()
                    conn.close()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
                    
            except Exception as e:
                print(f"[ERROR] Failed to process media group: {e}")
                import traceback
                print(traceback.format_exc())
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        print(f"[MESSAGE] From {username} ({telegram_id}): {message_text}, Photos: {len(photo_urls)}")
        
        # Команда /admin - статистика для админов
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
                '/setwebhook - установить webhook\n'
                '/broadcast [текст] - рассылка всем'
            )
            send_telegram_message(bot_token, chat_id, admin_text)
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Команда /users - список последних пользователей
        if message_text == '/users':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT telegram_id, username, first_name, total_used, free_generations, paid_generations FROM {DB_SCHEMA}.neurophoto_users ORDER BY created_at DESC LIMIT 20")
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
        if message_text == '/topusers':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            cur.execute(f"SELECT telegram_id, username, total_used, paid_generations FROM {DB_SCHEMA}.neurophoto_users ORDER BY total_used DESC LIMIT 15")
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
        if message_text.startswith('/addpro'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                user_input = message_text.split()[1].lstrip('@')
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = 999999 WHERE telegram_id = %s RETURNING telegram_id, username", (user_id,))
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = 999999 WHERE username = %s RETURNING telegram_id, username", (user_input,))
                
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
        if message_text.startswith('/addgens'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET free_generations = free_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET free_generations = free_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                
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
        if message_text.startswith('/addpaidgens'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                parts = message_text.split()
                user_input = parts[1].lstrip('@')
                amount = int(parts[2])
                
                # Попытка найти по логину или ID
                try:
                    user_id = int(user_input)
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = paid_generations + %s WHERE telegram_id = %s RETURNING telegram_id, username", (amount, user_id))
                except ValueError:
                    cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET paid_generations = paid_generations + %s WHERE username = %s RETURNING telegram_id, username", (amount, user_input))
                
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
        if message_text.startswith('/userinfo'):
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            try:
                user_input = message_text.split()[1].lstrip('@')
                
                # Попытка найти по логину или ID
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
        
        # Команда /setwebhook - установить webhook (только для админа)
        if message_text == '/setwebhook':
            if not is_admin(telegram_id):
                send_telegram_message(bot_token, chat_id, '❌ У вас нет доступа к этой команде.')
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
                        send_telegram_message(bot_token, chat_id, f'✅ Webhook установлен:\n{webhook_url}')
                    else:
                        send_telegram_message(bot_token, chat_id, f'❌ Ошибка установки webhook:\n{result.get("description", "Unknown")}')
            except Exception as e:
                send_telegram_message(bot_token, chat_id, f'❌ Ошибка: {str(e)}')
            
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
                '<b>Доступные модели:</b>\n'
                '🟢 Nemotron Nano - компактная vision-модель\n'
                '💚 Gemma 3 - высокая точность\n'
                '⚡ Gemini Flash - скорость + качество\n'
                '🔵 Mistral Small - точные инструкции\n\n'
                '<b>Pro модели:</b>\n'
                '💎 Gemini 3 Pro - топ от Google\n'
                '🌟 FLUX 2 Flex - любые стили\n'
                '💫 FLUX 2 Pro - максимум качества\n'
                '🎨 GPT-5 Image - новейшая от OpenAI\n\n'
                '<b>Тарифы:</b>\n'
                '🆓 Бесплатно: 3 изображения\n'
                '💎 PRO: 299₽/мес - безлимит + Pro модели'
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
            cur.execute(f"SELECT free_generations, paid_generations, total_used, preferred_model FROM {DB_SCHEMA}.neurophoto_users WHERE telegram_id = %s", (telegram_id,))
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
        
        # Проверка на неизвестные команды
        if message_text.startswith('/'):
            send_telegram_message(bot_token, chat_id, '❓ Неизвестная команда.\n\nИспользуйте /help для списка доступных команд.')
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # Генерация изображения
        cur.execute(
            f"INSERT INTO {DB_SCHEMA}.neurophoto_users (telegram_id, username, first_name) VALUES (%s, %s, %s) "
            f"ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name "
            f"RETURNING free_generations, paid_generations, total_used, preferred_model",
            (telegram_id, username, first_name)
        )
        user_data = cur.fetchone()
        conn.commit()
        
        free_left = max(0, user_data['free_generations'])
        is_paid = user_data['paid_generations'] > 0
        preferred_model = user_data.get('preferred_model') or 'google/gemini-2.0-flash-exp:free'
        
        # Конвертация старых моделей в новые (если у пользователя осталась старая модель)
        old_to_new_models = {
            'gemini-2.5-flash-image': 'google/gemini-2.0-flash-exp:free',
            'google/gemini-2.5-flash-image-preview:free': 'google/gemini-2.0-flash-exp:free',
            'openai/dall-e-3': 'openai/gpt-5-image',
            'black-forest-labs/flux-pro': 'black-forest-labs/flux.2-pro',
            'black-forest-labs/flux-1.1-pro': 'black-forest-labs/flux.2-pro',
            'black-forest-labs/flux-2-pro': 'black-forest-labs/flux.2-pro'
        }
        
        if preferred_model in old_to_new_models:
            preferred_model = old_to_new_models[preferred_model]
            # Обновляем модель в БД
            cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET preferred_model = %s WHERE telegram_id = %s", (preferred_model, telegram_id))
            conn.commit()
        
        print(f"[USER] Free: {free_left}, Paid: {is_paid}, Model: {preferred_model}")
        
        # Проверка лимитов
        if not is_paid and free_left <= 0:
            limit_text = (
                '❌ <b>Бесплатный лимит исчерпан</b>\n\n'
                'Вы использовали все 3 бесплатные генерации.\n\n'
                '💎 <b>Безлимитный доступ - 299₽/мес</b>\n'
                '• Неограниченные генерации\n'
                '• Gemini 3 Pro - топ от Google\n'
                '• FLUX 2 Pro - максимум качества\n'
                '• GPT-5 Image - новейшая от OpenAI\n'
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
                'Используется бесплатная модель Gemini Flash.\n\n'
                'Для доступа к Pro моделям напишите /pay'
            )
            preferred_model = 'google/gemini-2.0-flash-exp:free'
        
        print(f"[GENERATE] Model: {preferred_model}, Prompt: {message_text[:50]}, Photos: {len(photo_urls)}")
        all_models = IMAGE_MODELS['free'] + IMAGE_MODELS['paid']
        model_name = next((m['name'] for m in all_models if m['id'] == preferred_model), preferred_model)
        
        # Список моделей с поддержкой vision (работа с фото)
        vision_models = [
            'nvidia/nemotron-nano-12b-v2-vl:free',
            'google/gemini-2.0-flash-exp:free',
            'google/gemini-3-pro-image-preview',
            'google/gemini-2.5-flash-image'
        ]
        
        # Проверяем, поддерживает ли модель vision (работу с фото)
        if photo_urls and preferred_model not in vision_models:
            send_telegram_message(bot_token, chat_id, 
                '⚠️ Выбранная модель не поддерживает работу с изображениями.\n\n'
                'Для работы с фото выберите:\n'
                '• Nemotron Nano (бесплатно)\n'
                '• Gemini Flash (бесплатно)\n'
                '• Gemini 3 Pro (Pro)\n'
                '• Gemini 2.5 Flash (Pro)\n\n'
                'Используйте /models для выбора модели.'
            )
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
        
        # CRITICAL: Определяем режим работы
        is_generation_mode = preferred_model in ['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image', 'black-forest-labs/flux.2-flex', 'black-forest-labs/flux.2-pro', 'openai/gpt-5-image']
        
        if photo_urls and is_generation_mode:
            send_telegram_message(bot_token, chat_id, f'⏳ Генерирую изображение на основе {len(photo_urls)} фото с помощью {model_name}...\n\nЭто займет 10-60 секунд.')
        elif photo_urls:
            send_telegram_message(bot_token, chat_id, f'⏳ Анализирую {len(photo_urls)} фото с помощью {model_name}...\n\nЭто займет 10-60 секунд.')
        else:
            send_telegram_message(bot_token, chat_id, f'⏳ Генерирую изображение с помощью {model_name}...\n\nЭто займет 10-60 секунд.')
        
        image_url = generate_image_openrouter(message_text, preferred_model, photo_urls)
        
        # DEBUG: отправляем информацию о полученном ответе
        if not image_url:
            print(f"[ERROR] No image_url returned from OpenRouter")
            send_telegram_message(bot_token, chat_id, '🔍 DEBUG: OpenRouter вернул ответ, но изображение не найдено.\n\nПроверьте логи функции.')
        
        if image_url:
            # CRITICAL: image_url может быть строкой, списком или dict!
            print(f"[SUCCESS] Image received from OpenRouter!")
            print(f"[SUCCESS] Image type: {type(image_url).__name__}")
            
            # Если это список - берем первый элемент
            if isinstance(image_url, list):
                print(f"[SUCCESS] Image is a list with {len(image_url)} items, taking first")
                if len(image_url) > 0:
                    image_url = image_url[0]
                else:
                    print(f"[ERROR] Image list is empty!")
                    image_url = None
            
            # Если это dict - ищем URL внутри
            if isinstance(image_url, dict):
                print(f"[SUCCESS] Image is dict with keys: {list(image_url.keys())}")
                if 'url' in image_url:
                    image_url = image_url['url']
                elif 'data' in image_url:
                    image_url = image_url['data']
                elif 'image_url' in image_url:
                    # CRITICAL: Gemini 3 Pro возвращает {'type': '...', 'image_url': '...', 'index': ...}
                    print(f"[SUCCESS] Found nested 'image_url' key")
                    nested = image_url['image_url']
                    if isinstance(nested, dict) and 'url' in nested:
                        image_url = nested['url']
                    elif isinstance(nested, str):
                        image_url = nested
                    else:
                        print(f"[ERROR] Unexpected nested image_url type: {type(nested).__name__}")
                        image_url = None
                else:
                    print(f"[ERROR] No 'url', 'data', or 'image_url' key in image dict!")
                    image_url = None
            
            if image_url and isinstance(image_url, str):
                print(f"[SUCCESS] Final image_url (first 100 chars): {image_url[:100]}")
                print(f"[SUCCESS] Is base64 data URL: {image_url.startswith('data:image')}")
            else:
                print(f"[ERROR] image_url is not a string after processing: {type(image_url).__name__}")
                image_url = None
        
        if image_url:
            
            # CRITICAL: Always upload to S3, especially for base64 images
            cdn_url = upload_to_s3(image_url, telegram_id)
            
            if not cdn_url:
                print(f"[ERROR] S3 upload failed, cannot send image to user")
                send_telegram_message(bot_token, chat_id, '❌ Изображение сгенерировано, но произошла ошибка при сохранении.\n\nПопробуйте еще раз.')
                cur.close()
                conn.close()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'isBase64Encoded': False, 'body': json.dumps({'ok': True})}
            
            print(f"[SUCCESS] CDN URL: {cdn_url}")
            final_url = cdn_url
            
            caption = f'✅ Готово!\n\n💬 {message_text[:100]}\n🎨 {model_name}'
            if not is_paid:
                caption += f'\n\n🆓 Осталось: {free_left - 1}'
            
            photo_sent = send_telegram_photo(bot_token, chat_id, final_url, caption)
            print(f"[SUCCESS] Photo sent to Telegram: {photo_sent}")
            
            if not photo_sent:
                print(f"[ERROR] Failed to send photo to Telegram, sending URL as text")
                send_telegram_message(bot_token, chat_id, f'{caption}\n\nИзображение: {final_url}')
            
            # Обновляем или создаем запись generation
            if generation_id:
                # Для media group обновляем существующую запись маркера
                print(f"[SUCCESS] Updating media group marker with actual result")
                cur.execute(
                    f"UPDATE {DB_SCHEMA}.neurophoto_generations SET "
                    f"model = %s, image_url = %s, is_paid = %s "
                    f"WHERE telegram_id = %s AND prompt = %s",
                    (preferred_model, final_url, is_paid, telegram_id, f"media_group:{generation_id}")
                )
            else:
                # Для обычного сообщения создаем новую запись
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) VALUES (%s, %s, %s, %s, %s)",
                    (telegram_id, message_text, preferred_model, final_url, is_paid)
                )
            
            if not is_paid:
                cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET free_generations = free_generations - 1, total_used = total_used + 1 WHERE telegram_id = %s", (telegram_id,))
            else:
                cur.execute(f"UPDATE {DB_SCHEMA}.neurophoto_users SET total_used = total_used + 1 WHERE telegram_id = %s", (telegram_id,))
            
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