'''
Business: Telegram-бот для создания AI-фотосессий через Hugging Face Serverless API (бесплатно)
Args: event - dict with httpMethod (POST для webhook), body (JSON от Telegram)
      context - object with request_id, function_name, etc.
Returns: HTTP response dict с обработкой команд и генерацией изображений
'''

import json
import os
import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass

TELEGRAM_TOKEN = '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4'
HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY', '')
HUGGINGFACE_API = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'

def get_telegram_api() -> str:
    return f'https://api.telegram.org/bot{TELEGRAM_TOKEN}'

@dataclass
class User:
    user_id: int
    username: Optional[str]
    first_name: str
    free_generations: int = 3

def send_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> None:
    '''Отправка сообщения в Telegram'''
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'MarkdownV2'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    try:
        response = requests.post(f'{get_telegram_api()}/sendMessage', json=data, timeout=10)
        print(f'sendMessage response: {response.status_code}, {response.text}')
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo(chat_id: int, photo_url: str, caption: str = '') -> None:
    '''Отправка фото в Telegram'''
    data = {
        'chat_id': chat_id,
        'photo': photo_url,
        'caption': caption,
        'parse_mode': 'MarkdownV2'
    }
    requests.post(f'{get_telegram_api()}/sendPhoto', json=data)

def send_chat_action(chat_id: int, action: str = 'upload_photo') -> None:
    '''Отправка статуса (печатает, загружает фото и т.д.)'''
    requests.post(f'{get_telegram_api()}/sendChatAction', json={
        'chat_id': chat_id,
        'action': action
    })

def generate_image(prompt: str, style: str = 'portrait') -> Optional[str]:
    '''Генерация изображения через Hugging Face Serverless API (100% бесплатно)'''
    if not HUGGINGFACE_API_KEY:
        print('HUGGINGFACE_API_KEY not configured')
        return None
    
    style_prompts = {
        'portrait': 'professional portrait photo, studio lighting, high detail, photorealistic',
        'fashion': 'fashion photography, editorial style, vogue magazine, professional',
        'business': 'professional business portrait, corporate, confident, formal',
        'art': 'artistic portrait, dramatic lighting, cinematic, creative',
        'urban': 'urban street photography, city background, modern style',
        'nature': 'natural outdoor portrait, soft natural light, beautiful scenery',
        'concept': 'conceptual art portrait, creative, unique, artistic vision',
        'creative': 'creative photography, innovative style, artistic approach'
    }
    
    full_prompt = f"{prompt}, {style_prompts.get(style, style_prompts['portrait'])}"
    
    try:
        headers = {
            'Authorization': f'Bearer {HUGGINGFACE_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'inputs': full_prompt,
            'parameters': {
                'num_inference_steps': 4,
                'guidance_scale': 0
            }
        }
        
        response = requests.post(
            HUGGINGFACE_API,
            headers=headers,
            json=payload,
            timeout=90
        )
        
        if response.status_code == 200:
            image_bytes = response.content
            
            upload_url = f'{get_telegram_api()}/sendPhoto'
            files = {'photo': ('image.png', image_bytes, 'image/png')}
            data = {'chat_id': 'temp'}
            
            return image_bytes
        else:
            print(f'Hugging Face API error: {response.status_code}, {response.text}')
            return None
            
    except Exception as e:
        print(f'Error generating image via Hugging Face: {e}')
        return None

def send_photo_bytes(chat_id: int, image_bytes: bytes, caption: str = '') -> None:
    '''Отправка фото из байтов в Telegram'''
    try:
        url = f'{get_telegram_api()}/sendPhoto'
        files = {'photo': ('generated.png', image_bytes, 'image/png')}
        data = {
            'chat_id': chat_id,
            'caption': caption,
            'parse_mode': 'MarkdownV2'
        }
        response = requests.post(url, files=files, data=data, timeout=30)
        print(f'sendPhoto response: {response.status_code}')
    except Exception as e:
        print(f'Error sending photo bytes: {e}')

def get_start_keyboard() -> Dict:
    '''Клавиатура для главного меню'''
    return {
        'inline_keyboard': [
            [{'text': '🎨 Создать фото из текста', 'callback_data': 'generate_text'}],
            [{'text': '📸 Обработать мое фото', 'callback_data': 'process_photo'}],
            [{'text': '🎁 Мои бонусы', 'callback_data': 'bonuses'}],
            [{'text': '💎 Купить пакет фото', 'callback_data': 'buy_package'}],
            [{'text': '❓ Помощь', 'callback_data': 'help'}]
        ]
    }

def get_styles_keyboard() -> Dict:
    '''Клавиатура для выбора стиля'''
    return {
        'inline_keyboard': [
            [
                {'text': '📷 Портрет', 'callback_data': 'style_portrait'},
                {'text': '👗 Fashion', 'callback_data': 'style_fashion'}
            ],
            [
                {'text': '💼 Бизнес', 'callback_data': 'style_business'},
                {'text': '🎨 Арт', 'callback_data': 'style_art'}
            ],
            [
                {'text': '🌆 Городской', 'callback_data': 'style_urban'},
                {'text': '🌿 Природа', 'callback_data': 'style_nature'}
            ],
            [{'text': '⬅️ Назад', 'callback_data': 'back_menu'}]
        ]
    }

def handle_start(chat_id: int, first_name: str) -> None:
    '''Обработка команды /start'''
    welcome_text = f'''👋 Привет, *{first_name}*\!

Я *Нейрофотосессия PRO* \- твой AI\-фотограф в Telegram\!

🎨 *Что я умею:*
\- Создаю фото из текстового описания
\- Обрабатываю твои фотографии  
\- Применяю 10\+ профессиональных стилей
\- Генерирую HD качество

🎁 *Бонус:*
У тебя есть *3 бесплатные* генерации\!

Выбери действие ниже 👇'''
    send_message(chat_id, welcome_text, get_start_keyboard())

def handle_help(chat_id: int) -> None:
    '''Справка по использованию'''
    help_text = '''📖 *Как создать идеальное фото:*

*1\. Генерация из текста* 🎨
Опиши желаемое фото максимально подробно:
\- Кто на фото \(возраст, пол, внешность\)
\- Одежда и аксессуары
\- Поза и эмоции
\- Окружение и фон
\- Освещение

*Пример:*
"Портрет девушки 25 лет с длинными каштановыми волосами, в белой рубашке, улыбается, офисный фон, естественное освещение"

*2\. Стили фотосессий* 📷
\- *Портрет* \- классика, студия
\- *Fashion* \- модная съемка
\- *Бизнес* \- деловой стиль
\- *Арт* \- креативное фото
\- *Городской* \- уличная съемка
\- *Природа* \- натуральный свет

*3\. Пакеты* 💎
\- Мини \(5 фото\) \- 299₽
\- Стандарт \(10 фото\) \- 499₽
\- Профи \(20 фото\) \- 799₽

*Вопросы?* Пиши @support\_bot'''
    send_message(chat_id, help_text, get_start_keyboard())

def handle_callback(chat_id: int, data: str, message_id: int) -> None:
    '''Обработка нажатий на кнопки'''
    if data == 'generate_text':
        text = '''🎨 *Генерация фото из текста*

Опиши, какое фото ты хочешь создать\\.

*Пример хорошего описания:*
"Профессиональный портрет мужчины 30 лет в синем костюме, нейтральный серый фон, уверенный взгляд, студийное освещение"

*Напиши свой промпт:*'''
        send_message(chat_id, text, get_styles_keyboard())
    
    elif data == 'process_photo':
        text = '''📸 *Обработка твоего фото*

Загрузи свою фотографию, и я применю к ней профессиональные эффекты\!

*Доступные эффекты:*
\- Улучшение качества
\- Изменение стиля
\- Профессиональная ретушь
\- Художественные фильтры

Отправь фото 👇'''
        send_message(chat_id, text, get_start_keyboard())
    
    elif data == 'bonuses':
        text = '''🎁 *Твои бонусы*

Бесплатных генераций: *3*
Купленных генераций: *0*

💡 После использования бесплатных генераций можно:
\- Купить пакет фото
\- Пригласить друзей \(\+2 за друга\)
\- Участвовать в конкурсах

Используй бонусы с умом\! 🎯'''
        send_message(chat_id, text, get_start_keyboard())
    
    elif data == 'buy_package':
        text = '''💎 *Пакеты фотосессий*

*Мини* \- 299₽
\- 5 генераций
\- HD качество
\- Все стили

*Стандарт* \- 499₽ 🔥
\- 10 генераций
\- HD качество
\- Все стили
\- Приоритетная обработка

*Профи* \- 799₽ ⭐
\- 20 генераций
\- HD качество
\- Все стили
\- Приоритетная обработка
\- Эксклюзивные стили

Для покупки свяжись с @support\_bot'''
        send_message(chat_id, text, get_start_keyboard())
    
    elif data == 'help':
        handle_help(chat_id)
    
    elif data == 'back_menu':
        text = 'Выбери действие 👇'
        send_message(chat_id, text, get_start_keyboard())
    
    elif data.startswith('style_'):
        style = data.replace('style_', '')
        text = f'''✨ Выбран стиль: *{style.capitalize()}*

Теперь напиши описание желаемого фото\.
Я создам изображение в выбранном стиле\!

*Пример:*
"Портрет девушки 25 лет, длинные волосы, улыбка"'''
        send_message(chat_id, text)

user_states = {}

def handle_message(chat_id: int, text: str, first_name: str) -> None:
    '''Обработка текстовых сообщений'''
    if text.startswith('/start'):
        handle_start(chat_id, first_name)
        return
    
    if text.startswith('/help'):
        handle_help(chat_id)
        return
    
    send_message(chat_id, '🎨 Генерирую твое фото... Это займет 20-40 секунд')
    send_chat_action(chat_id, 'upload_photo')
    
    image_bytes = generate_image(text, 'portrait')
    
    if image_bytes:
        caption = f'✨ *Готово!*\n\n_{text[:100]}_' if len(text) <= 100 else f'✨ *Готово!*\n\n_{text[:100]}..._'
        send_photo_bytes(chat_id, image_bytes, caption)
        send_message(chat_id, '🎉 Фото готово! Хочешь создать еще?', get_start_keyboard())
    else:
        error_text = '''❌ Не удалось сгенерировать фото\.

*Возможные причины:*
\- Модель загружается \(попробуй через минуту\)
\- API недоступен \(попробуй позже\)
\- Промпт содержит запрещенный контент

Попробуй еще раз или купи пакет 💎'''
        send_message(chat_id, error_text, get_start_keyboard())

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    print(f'Received request: method={method}')
    
    body_str = event.get('body', '{}')
    print(f'Event body: {body_str}')
    
    try:
        update = json.loads(body_str)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    print(f'TELEGRAM_TOKEN configured: {bool(TELEGRAM_TOKEN)}')
    
    if 'message' in update:
        message = update['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        first_name = message['from'].get('first_name', 'Friend')
        
        handle_message(chat_id, text, first_name)
    
    elif 'callback_query' in update:
        callback = update['callback_query']
        chat_id = callback['message']['chat']['id']
        data = callback['data']
        message_id = callback['message']['message_id']
        
        handle_callback(chat_id, data, message_id)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'ok': True})
    }