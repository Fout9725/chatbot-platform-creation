'''
Business: Telegram-бот для создания AI-фотосессий через FLUX и Stable Diffusion
Args: event - dict with httpMethod (POST для webhook), body (JSON от Telegram)
      context - object with request_id, function_name, etc.
Returns: HTTP response dict с обработкой команд и генерацией изображений
'''

import json
import os
import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass

TELEGRAM_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '8388674714:AAGkP3PmvRibKsPDpoX3z66ErPiKAfvQhy4')
TOGETHER_API_KEY = os.environ.get('TOGETHER_API_KEY', '')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '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')
TELEGRAM_API = f'https://api.telegram.org/bot{TELEGRAM_TOKEN}'
TOGETHER_API = 'https://api.together.xyz/v1/images/generations'
OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'

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
        'parse_mode': 'Markdown'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    try:
        response = requests.post(f'{TELEGRAM_API}/sendMessage', json=data, timeout=10)
        print(f'sendMessage response: {response.status_code}, {response.text}')
    except Exception as e:
        print(f'Error sending message: {e}')

def send_photo(chat_id: int, photo_url: str, caption: str = '') -> None:
    '''Отправка фото в Telegram'''
    data = {
        'chat_id': chat_id,
        'photo': photo_url,
        'caption': caption,
        'parse_mode': 'Markdown'
    }
    requests.post(f'{TELEGRAM_API}/sendPhoto', json=data)

def send_chat_action(chat_id: int, action: str = 'upload_photo') -> None:
    '''Отправка статуса (печатает, загружает фото и т.д.)'''
    requests.post(f'{TELEGRAM_API}/sendChatAction', json={
        'chat_id': chat_id,
        'action': action
    })

def generate_image(prompt: str, style: str = 'portrait') -> Optional[str]:
    '''Генерация изображения через OpenRouter AI или Together AI (FLUX)'''
    style_prompts = {
        'portrait': 'professional portrait photo, studio lighting, high detail',
        'fashion': 'fashion photography, editorial style, vogue magazine',
        'business': 'professional business portrait, corporate, confident',
        'art': 'artistic portrait, dramatic lighting, cinematic',
        'urban': 'urban street photography, city background',
        'nature': 'natural outdoor portrait, soft natural light',
        'concept': 'conceptual art portrait, creative, unique',
        'creative': 'creative photography, innovative style'
    }
    
    full_prompt = f"{prompt}, {style_prompts.get(style, style_prompts['portrait'])}"
    
    if OPENROUTER_API_KEY:
        try:
            response = requests.post(
                OPENROUTER_API,
                headers={
                    'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://poehali.dev',
                    'X-Title': 'Нейрофотосессия PRO'
                },
                json={
                    'model': 'openai/dall-e-3',
                    'messages': [{
                        'role': 'user',
                        'content': full_prompt
                    }]
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'choices' in data and len(data['choices']) > 0:
                    content = data['choices'][0]['message']['content']
                    if 'https://' in content:
                        start = content.find('https://')
                        end = content.find(' ', start)
                        if end == -1:
                            end = len(content)
                        return content[start:end].strip()
        except Exception as e:
            print(f'Error generating image via OpenRouter: {e}')
    
    if TOGETHER_API_KEY:
        try:
            response = requests.post(
                TOGETHER_API,
                headers={
                    'Authorization': f'Bearer {TOGETHER_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'black-forest-labs/FLUX.1-schnell-Free',
                    'prompt': full_prompt,
                    'width': 1024,
                    'height': 1024,
                    'steps': 4,
                    'n': 1
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and len(data['data']) > 0:
                    return data['data'][0]['url']
        except Exception as e:
            print(f'Error generating image via Together: {e}')
    
    return None

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
    welcome_text = f'''
👋 Привет, *{first_name}*!

Я *Нейрофотосессия PRO* — твой AI-фотограф в Telegram!

🎨 *Что я умею:*
• Создаю фото из текстового описания
• Обрабатываю твои фотографии
• Применяю 10+ профессиональных стилей
• Генерирую HD качество (1024x1024)

🎁 *Бонус:*
У тебя есть *3 бесплатные* генерации!

Выбери действие ниже 👇
    '''
    send_message(chat_id, welcome_text, get_start_keyboard())

def handle_help(chat_id: int) -> None:
    '''Справка по использованию'''
    help_text = '''
📖 *Как создать идеальное фото:*

*1. Генерация из текста* 🎨
Опиши желаемое фото максимально подробно:
• Кто на фото (возраст, пол, внешность)
• Одежда и аксессуары
• Поза и эмоции
• Окружение и фон
• Освещение

*Пример:*
"Портрет девушки 25 лет с длинными каштановыми волосами, в белой рубашке, улыбается, офисный фон, естественное освещение"

*2. Стили фотосессий* 📷
• *Портрет* - классика, студия
• *Fashion* - модная съемка
• *Бизнес* - деловой стиль
• *Арт* - креативное фото
• *Городской* - уличная съемка
• *Природа* - натуральный свет

*3. Пакеты* 💎
• Мини (5 фото) - 299₽
• Стандарт (10 фото) - 499₽
• Профи (20 фото) - 799₽

*Вопросы?* Пиши @support_bot
    '''
    send_message(chat_id, help_text, get_start_keyboard())

def handle_callback(chat_id: int, data: str, message_id: int) -> None:
    '''Обработка нажатий на кнопки'''
    if data == 'generate_text':
        text = '''
🎨 *Генерация фото из текста*

Опиши, какое фото ты хочешь создать.

*Пример хорошего описания:*
"Профессиональный портрет мужчины 30 лет в синем костюме, нейтральный серый фон, уверенный взгляд, студийное освещение"

*Напиши свой промпт:*
        '''
        send_message(chat_id, text, get_styles_keyboard())
    
    elif data == 'process_photo':
        text = '''
📸 *Обработка твоего фото*

Загрузи свою фотографию, и я применю AI-обработку:
• Улучшение качества
• Изменение стиля
• Смена фона
• Профессиональная ретушь

*Отправь фото:*
        '''
        send_message(chat_id, text)
    
    elif data == 'bonuses':
        text = '''
🎁 *Твои бонусы*

🆓 Бесплатные генерации: *3 шт.*
💰 Реферальный баланс: *0₽*

*Как получить больше?*
• Пригласи друга - получи 20% от его покупок
• Купи пакет фотосессий
• Участвуй в акциях

🔗 Твоя реферальная ссылка:
`https://t.me/neurophoto_bot?start=ref123`
        '''
        send_message(chat_id, text, get_start_keyboard())
    
    elif data == 'buy_package':
        text = '''
💎 *Пакеты фотосессий*

📦 *Мини* - 299₽
• 5 генераций
• HD качество
• Все стили

📦 *Стандарт* - 499₽ ⭐
• 10 генераций
• HD качество
• Все стили
• Приоритетная очередь

📦 *Профи* - 799₽
• 20 генераций
• Ultra HD качество
• Все стили
• Без очереди
• Сохранение истории

💳 *Оплата:*
• Telegram Stars
• Банковская карта
• СБП
        '''
        keyboard = {
            'inline_keyboard': [
                [{'text': '💳 Купить Мини (299₽)', 'callback_data': 'pay_mini'}],
                [{'text': '💳 Купить Стандарт (499₽)', 'callback_data': 'pay_standard'}],
                [{'text': '💳 Купить Профи (799₽)', 'callback_data': 'pay_pro'}],
                [{'text': '⬅️ Назад', 'callback_data': 'back_menu'}]
            ]
        }
        send_message(chat_id, text, keyboard)
    
    elif data.startswith('style_'):
        style = data.replace('style_', '')
        text = f'''
✨ Выбран стиль: *{style.capitalize()}*

Теперь напиши описание желаемого фото.
Я создам изображение в выбранном стиле!

*Пример:*
"Портрет девушки 25 лет, длинные волосы, улыбка"
        '''
        send_message(chat_id, text)
    
    elif data == 'back_menu':
        handle_start(chat_id, 'пользователь')
    
    elif data == 'help':
        handle_help(chat_id)

def handle_text_message(chat_id: int, text: str, first_name: str) -> None:
    '''Обработка текстового сообщения как промпта'''
    if len(text) < 10:
        send_message(chat_id, '⚠️ Опиши фото подробнее (минимум 10 символов)')
        return
    
    send_message(chat_id, '🎨 Генерирую твое фото... Это займет 20-40 секунд')
    send_chat_action(chat_id, 'upload_photo')
    
    image_url = generate_image(text, 'portrait')
    
    if image_url:
        caption = f'✨ Твоя AI-фотосессия готова!\n\n📝 Промпт: {text[:100]}...'
        send_photo(chat_id, image_url, caption)
        
        send_message(chat_id, '''
🎉 Фото готово!

*Что дальше?*
• Создай еще фото (осталось 2 бесплатных)
• Попробуй другой стиль
• Купи пакет для больше генераций

Выбери действие:
        ''', get_start_keyboard())
    else:
        send_message(chat_id, '''
❌ Не удалось сгенерировать фото.

*Возможные причины:*
• Закончились бесплатные генерации
• Проблема с API (попробуй через минуту)
• Промпт содержит запрещенный контент

Попробуй еще раз или купи пакет 💎
        ''', get_start_keyboard())

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    print(f'Received request: method={method}')
    print(f'Event body: {event.get("body", "{}")}')
    print(f'TELEGRAM_TOKEN configured: {bool(TELEGRAM_TOKEN)}')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'message' in body:
            message = body['message']
            chat_id = message['chat']['id']
            first_name = message['from'].get('first_name', 'пользователь')
            
            if 'text' in message:
                text = message['text']
                
                if text == '/start':
                    handle_start(chat_id, first_name)
                elif text == '/help':
                    handle_help(chat_id)
                else:
                    handle_text_message(chat_id, text, first_name)
        
        elif 'callback_query' in body:
            callback = body['callback_query']
            chat_id = callback['message']['chat']['id']
            message_id = callback['message']['message_id']
            data = callback['data']
            
            handle_callback(chat_id, data, message_id)
            
            requests.post(f'{TELEGRAM_API}/answerCallbackQuery', json={
                'callback_query_id': callback['id']
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
        
    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }