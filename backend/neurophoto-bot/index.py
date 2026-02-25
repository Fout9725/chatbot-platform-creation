"""Бот Нейрофотосессия PRO — генерация и редактирование фото через 7 AI моделей + AI-промтер"""

import json
import os
import base64
import time
import urllib.request
import urllib.error
import psycopg2
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BOT_TOKEN = os.environ.get('NEUROPHOTO_BOT_TOKEN', '')
GEMINI_KEY = os.environ.get('GEMINI_API_KEY', '')
VSEGPT_KEY = os.environ.get('VSEGPT_API_KEY', '')
OPENROUTER_KEY = os.environ.get('OPENROUTER_API_KEY', '')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

MODELS = {
    'gemini': {
        'name': '🟢 Gemini Flash (Google)',
        'api_id': 'gemini-2.5-flash-image',
        'provider': 'gemini',
        'desc': 'Быстрая генерация от Google. Хорошо понимает текстовые промпты на русском и английском. Отлично справляется с редактированием фото: смена фона, стиля, добавление элементов. Лучший выбор для начала.',
        'prompt_tips': 'Gemini хорошо понимает естественный язык. Промпт должен быть детальным описанием желаемого результата. Поддерживает русский язык. Хорошо работает с инструкциями вида "измени X на Y", "добавь Z", "сделай в стиле W".'
    },
    'nano-banana': {
        'name': '🍌 Nano Banana Pro Edit',
        'api_id': 'img2img-google/nano-banana-pro-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Модель от Google для мульти-редактирования. Может менять несколько элементов на фото одновременно. Хорошо работает с портретами и пейзажами.',
        'prompt_tips': 'Поддерживает несколько инструкций через запятую. Промпт на английском работает лучше. Формат: "change background to sunset, add sunglasses, make hair blonde". Можно указывать несколько изменений в одном промпте.'
    },
    'flux-klein': {
        'name': '⚡ FLUX 2 Klein 4B',
        'api_id': 'img2img-flux/flux-2-klein-4b',
        'provider': 'vsegpt',
        'desc': 'Компактная модель FLUX — быстрая и экономичная. Хорошо генерирует изображения с нуля по текстовому описанию. Стиль ближе к фотореализму.',
        'prompt_tips': 'Лучше работает с английскими промптами. Стиль: детальное описание сцены. Формат: "a portrait of a woman in autumn park, golden leaves, soft lighting, 4k, photorealistic". Указывайте освещение, стиль, качество.'
    },
    'seedream': {
        'name': '🌱 Seedream v4.5 Edit',
        'api_id': 'img2img-bytedance/seedream-v4.5-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Модель от ByteDance (создатели TikTok). Мульти-редактирование с сильным пониманием стилей. Отлично делает художественные эффекты и стилизацию.',
        'prompt_tips': 'Английские промпты. Сильна в стилизации: "convert to watercolor painting", "make it look like anime", "oil painting style". Поддерживает несколько инструкций. Хорошо понимает художественные стили.'
    },
    'reve': {
        'name': '✨ Reve Fast Edit',
        'api_id': 'img2img-reve-fast-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Быстрая модель для редактирования. Минимальное время генерации. Хорошо подходит для простых правок: смена цвета, фона, добавление аксессуаров.',
        'prompt_tips': 'Короткие чёткие промпты на английском. Формат: "change background to blue sky", "add red hat", "remove glasses". Чем проще инструкция — тем лучше результат. Одно изменение за раз.'
    },
    'chrono': {
        'name': '🧠 Chrono Edit Thinking',
        'api_id': 'img2img-nvidia/chrono-edit-thinking',
        'provider': 'vsegpt',
        'desc': 'Модель от NVIDIA с "размышлением". Анализирует фото перед редактированием, поэтому результат точнее. Дольше генерирует, но качественнее.',
        'prompt_tips': 'Подробные промпты на английском. Модель "думает", поэтому можно давать сложные инструкции. Формат: "carefully replace the sky with dramatic storm clouds while preserving the lighting on the subject". Чем детальнее — тем лучше.'
    },
    'flash-25': {
        'name': '💎 Flash 2.5 Edit (Google)',
        'api_id': 'img2img-google/flash-25-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Google Flash 2.5 — продвинутая модель мульти-редактирования. Высокое качество, хорошее понимание контекста. Одна из лучших для сложных правок.',
        'prompt_tips': 'Английские промпты. Поддерживает сложные мульти-инструкции. Формат: "change hair color to platinum blonde, add professional studio lighting, smooth skin, add subtle makeup". Понимает контекст и сохраняет идентичность лица.'
    }
}

DEFAULT_MODEL = 'gemini'

MODEL_INSTRUCTIONS = {
    'gemini': (
        '🟢 <b>Gemini Flash (Google)</b>\n\n'
        '<b>Тип:</b> Генерация + редактирование\n'
        '<b>Язык промптов:</b> Русский и английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Создавать изображения с нуля по описанию\n'
        '• Редактировать загруженные фото\n'
        '• Менять фон, стиль, добавлять элементы\n\n'
        '<b>Лучше всего для:</b> Первого знакомства с генерацией, простых задач, работы на русском языке\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Сделай фон осенним парком\n'
        '• Преврати фото в акварельную картину\n'
        '• Нарисуй кота в космосе'
    ),
    'nano-banana': (
        '🍌 <b>Nano Banana Pro Edit</b>\n\n'
        '<b>Тип:</b> Мульти-редактирование\n'
        '<b>Язык промптов:</b> Английский (лучше)\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Менять несколько элементов сразу\n'
        '• Работа с портретами и пейзажами\n'
        '• Точечные правки на фото\n\n'
        '<b>Лучше всего для:</b> Комплексного редактирования фото, когда нужно изменить сразу несколько вещей\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Change background to sunset, add sunglasses\n'
        '• Make hair blonde, add professional lighting\n'
        '• Remove text, improve quality'
    ),
    'flux-klein': (
        '⚡ <b>FLUX 2 Klein 4B</b>\n\n'
        '<b>Тип:</b> Генерация изображений\n'
        '<b>Язык промптов:</b> Английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Фотореалистичные изображения с нуля\n'
        '• Портреты, пейзажи, предметы\n'
        '• Хорошая детализация\n\n'
        '<b>Лучше всего для:</b> Генерации реалистичных изображений по описанию\n\n'
        '<b>Примеры промптов:</b>\n'
        '• A portrait in autumn park, golden leaves, soft light\n'
        '• Modern kitchen interior, minimalist, 4k\n'
        '• Cat wearing a tiny hat, studio photo'
    ),
    'seedream': (
        '🌱 <b>Seedream v4.5 Edit (ByteDance)</b>\n\n'
        '<b>Тип:</b> Мульти-редактирование + стилизация\n'
        '<b>Язык промптов:</b> Английский\n'
        '<b>Скорость:</b> Средняя (20-40 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Художественная стилизация (акварель, аниме, масло)\n'
        '• Мульти-редактирование\n'
        '• Сильное понимание стилей\n\n'
        '<b>Лучше всего для:</b> Стилизации фото под арт, аниме, живопись\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Convert to watercolor painting\n'
        '• Make it look like anime character\n'
        '• Oil painting style, renaissance'
    ),
    'reve': (
        '✨ <b>Reve Fast Edit</b>\n\n'
        '<b>Тип:</b> Быстрое редактирование\n'
        '<b>Язык промптов:</b> Английский\n'
        '<b>Скорость:</b> Очень быстрая (5-15 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Простые быстрые правки\n'
        '• Смена цветов и фона\n'
        '• Добавление/удаление элементов\n\n'
        '<b>Лучше всего для:</b> Быстрых простых правок, когда нужен результат за секунды\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Change background to blue sky\n'
        '• Add red hat\n'
        '• Remove glasses'
    ),
    'chrono': (
        '🧠 <b>Chrono Edit Thinking (NVIDIA)</b>\n\n'
        '<b>Тип:</b> Интеллектуальное редактирование\n'
        '<b>Язык промптов:</b> Английский\n'
        '<b>Скорость:</b> Медленная (30-60 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Анализирует фото перед редактированием\n'
        '• Сложные комплексные правки\n'
        '• Сохранение деталей при больших изменениях\n\n'
        '<b>Лучше всего для:</b> Сложных задач, где важна точность и качество\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Carefully replace sky with dramatic storm clouds\n'
        '• Transform into professional headshot photo\n'
        '• Age the person by 20 years realistically'
    ),
    'flash-25': (
        '💎 <b>Flash 2.5 Edit (Google)</b>\n\n'
        '<b>Тип:</b> Продвинутое мульти-редактирование\n'
        '<b>Язык промптов:</b> Английский\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Сложные мульти-инструкции\n'
        '• Высокое качество обработки\n'
        '• Сохранение идентичности лица\n\n'
        '<b>Лучше всего для:</b> Профессиональной обработки портретов, сложных задач\n\n'
        '<b>Примеры промптов:</b>\n'
        '• Change hair to platinum blonde, add studio lighting\n'
        '• Professional retouching, smooth skin, subtle makeup\n'
        '• Place person in Paris with Eiffel Tower background'
    )
}


def ok(data=None):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data or {'ok': True})}


def get_db():
    c = psycopg2.connect(os.environ['DATABASE_URL'])
    c.autocommit = True
    return c


def tg(method, data=None):
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/{method}'
    if data:
        payload = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    else:
        req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return {'ok': False}


def send_msg(chat_id, text, reply_markup=None):
    d = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        d['reply_markup'] = reply_markup
    return tg('sendMessage', d)


def send_photo_url(chat_id, photo_url, caption=''):
    d = {'chat_id': chat_id, 'photo': photo_url}
    if caption:
        d['caption'] = caption
        d['parse_mode'] = 'HTML'
    return tg('sendPhoto', d)


def send_photo_bytes(chat_id, img_bytes, caption=''):
    boundary = f'----NeuroBotBoundary{int(time.time())}'
    body = b''
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n'.encode()
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="result.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    body += img_bytes
    body += b'\r\n'
    if caption:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n'.encode()
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n'.encode()
    body += f'--{boundary}--\r\n'.encode()

    req = urllib.request.Request(
        f'https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return {'ok': False}


def download_tg_file(file_id):
    r = tg('getFile', {'file_id': file_id})
    if not r.get('ok'):
        return None
    fp = r['result']['file_path']
    url = f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fp}'
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=30) as resp:
            return resp.read()
    except Exception:
        return None


def download_url(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=30) as resp:
            return resp.read()
    except Exception:
        return None


def upload_s3(img_bytes, filename):
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    key = f'neurophoto/{filename}'
    s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def gemini_generate(prompt, photo_bytes=None):
    parts = []
    if photo_bytes:
        parts.append({
            'inlineData': {
                'mimeType': 'image/jpeg',
                'data': base64.b64encode(photo_bytes).decode('utf-8')
            }
        })
    parts.append({'text': prompt})

    payload = json.dumps({
        'contents': [{'parts': parts}],
        'generationConfig': {
            'responseModalities': ['TEXT', 'IMAGE']
        }
    }).encode('utf-8')

    model_id = MODELS['gemini']['api_id']
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={GEMINI_KEY}'
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        return None, f'Gemini API error {e.code}: {err_body[:200]}'
    except Exception as e:
        return None, f'Ошибка соединения: {str(e)[:100]}'

    candidates = result.get('candidates', [])
    if not candidates:
        block = result.get('promptFeedback', {}).get('blockReason', '')
        if block:
            return None, f'Запрос заблокирован: {block}. Попробуйте другой промпт.'
        return None, 'Пустой ответ от Gemini. Попробуйте другой промпт.'

    content_parts = candidates[0].get('content', {}).get('parts', [])
    for part in content_parts:
        if 'inlineData' in part:
            return base64.b64decode(part['inlineData']['data']), None

    texts = [p.get('text', '') for p in content_parts if 'text' in p]
    return None, 'Модель не вернула изображение. ' + (' '.join(texts))[:200]


def vsegpt_generate(model_key, prompt, photo_bytes=None):
    if not VSEGPT_KEY:
        return None, 'VSEGPT_API_KEY не настроен'

    model_info = MODELS.get(model_key, {})
    api_model = model_info.get('api_id', '')

    body = {
        'model': api_model,
        'prompt': prompt,
        'response_format': 'b64_json'
    }
    if photo_bytes:
        b64 = base64.b64encode(photo_bytes).decode('utf-8')
        body['image_url'] = f'data:image/jpeg;base64,{b64}'

    payload = json.dumps(body).encode('utf-8')

    req = urllib.request.Request(
        'https://api.vsegpt.ru/v1/images/generations',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {VSEGPT_KEY}'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        return None, f'VseGPT error {e.code}: {err_body[:200]}'
    except Exception as e:
        return None, f'Ошибка соединения: {str(e)[:100]}'

    data_list = result.get('data', [])
    if not data_list:
        return None, 'Пустой ответ от VseGPT. Попробуйте другой промпт.'

    item = data_list[0]

    b64_data = item.get('b64_json', '')
    if b64_data:
        return base64.b64decode(b64_data), None

    url_val = item.get('url', '')
    if url_val:
        img_data = download_url(url_val)
        if img_data:
            return img_data, None

    return None, 'Модель не вернула изображение. Попробуйте другой промпт или модель.'


def generate_image(model_key, prompt, photo_bytes=None):
    model_info = MODELS.get(model_key)
    if not model_info:
        return None, f'Неизвестная модель: {model_key}'

    if model_info['provider'] == 'gemini':
        return gemini_generate(prompt, photo_bytes)
    else:
        return vsegpt_generate(model_key, prompt, photo_bytes)


def openrouter_generate_prompt(model_key, user_description):
    if not OPENROUTER_KEY:
        return None, 'OPENROUTER_API_KEY не настроен'

    model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

    system_prompt = (
        'You are an expert AI image generation prompt engineer. '
        'Your task is to take a user description (possibly in Russian) and convert it into an optimal prompt '
        f'for the "{model_info["name"]}" image generation model.\n\n'
        f'Model specifics: {model_info.get("prompt_tips", "")}\n\n'
        'Rules:\n'
        '1. Output ONLY the final prompt text, nothing else\n'
        '2. Make the prompt detailed, specific, and optimized for the target model\n'
        '3. Include style, lighting, quality, and composition details\n'
        '4. If the model works better with English prompts, write in English\n'
        '5. If the model supports Russian (like Gemini), you may use Russian if the user wrote in Russian\n'
        '6. Keep the prompt under 300 characters\n'
        '7. Do NOT add explanations, just the prompt'
    )

    payload = json.dumps({
        'model': 'nvidia/nemotron-3-nano-30b-a3b:free',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_description}
        ],
        'max_tokens': 500,
        'temperature': 0.7
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENROUTER_KEY}'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        return None, f'OpenRouter error {e.code}: {err_body[:200]}'
    except Exception as e:
        return None, f'Ошибка AI: {str(e)[:100]}'

    choices = result.get('choices', [])
    if not choices:
        return None, 'AI не вернул промпт. Попробуйте ещё раз.'

    content = choices[0].get('message', {}).get('content', '').strip()
    if not content:
        return None, 'Пустой ответ от AI.'

    return content, None


def get_user(conn, tid, uname, fname):
    cur = conn.cursor()
    cur.execute(
        f"SELECT telegram_id, free_generations, paid_generations, total_used, preferred_model, session_state, session_photo_url FROM {SCHEMA}.neurophoto_users WHERE telegram_id = %s",
        (tid,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        model = row[4] or DEFAULT_MODEL
        if model not in MODELS:
            model = DEFAULT_MODEL
        return {'tid': row[0], 'free': row[1], 'paid': row[2], 'used': row[3], 'model': model, 'state': row[5], 'photo': row[6]}

    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_users (telegram_id, username, first_name, free_generations, paid_generations, preferred_model) VALUES (%s, %s, %s, 3, 0, %s)",
        (tid, uname or '', fname or 'User', DEFAULT_MODEL)
    )
    cur.close()
    return {'tid': tid, 'free': 3, 'paid': 0, 'used': 0, 'model': DEFAULT_MODEL, 'state': None, 'photo': None}


def set_session(conn, tid, state, photo=None):
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET session_state = %s, session_photo_url = %s, session_updated_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (state, photo, tid)
    )
    cur.close()


def set_model(conn, tid, model_key):
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET preferred_model = %s WHERE telegram_id = %s",
        (model_key, tid)
    )
    cur.close()


def record_gen(conn, tid, prompt, model_key, url, is_paid):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) VALUES (%s, %s, %s, %s, %s)",
        (tid, prompt[:500], model_key, url, is_paid)
    )
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (tid,)
    )
    cur.close()


def remaining(u):
    return u['free'] + u['paid'] - u['used']


def model_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        row.append({'text': info['name'], 'callback_data': f'model:{key}'})
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return {'inline_keyboard': buttons}


def info_model_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        row.append({'text': info['name'], 'callback_data': f'info:{key}'})
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return {'inline_keyboard': buttons}


def prompt_model_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        row.append({'text': info['name'], 'callback_data': f'promptfor:{key}'})
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return {'inline_keyboard': buttons}


def current_model_text(model_key):
    info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])
    return f"{info['name']}"


def start_keyboard():
    return {'inline_keyboard': [
        [{'text': '🤖 Выбрать модель', 'callback_data': 'show_models'}],
        [{'text': '📖 Инструкция по моделям', 'callback_data': 'show_info'}],
        [{'text': '✨ Составить промпт (AI)', 'callback_data': 'show_prompt'}]
    ]}


def do_generate(conn, chat_id, tid, user, prompt, photo_bytes=None):
    model_key = user.get('model', DEFAULT_MODEL)
    model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

    tg('sendChatAction', {'chat_id': chat_id, 'action': 'upload_photo'})
    send_msg(chat_id, f'🎨 Генерирую через {model_info["name"]}...\nОбычно 15-60 секунд.')

    img_bytes, err = generate_image(model_key, prompt, photo_bytes)

    if err:
        send_msg(chat_id, f'❌ {err}')
        set_session(conn, tid, None)
        return

    fname = f'{tid}_{int(time.time())}.png'
    cdn_url = upload_s3(img_bytes, fname)

    left = remaining(user) - 1
    caption = f'✨ Готово! Модель: {model_info["name"]}\n💎 Осталось: <b>{left}</b>'
    res = send_photo_url(chat_id, cdn_url, caption)
    if not res.get('ok'):
        send_photo_bytes(chat_id, img_bytes, caption)

    record_gen(conn, tid, prompt, model_key, cdn_url, user['paid'] > 0)
    set_session(conn, tid, None)


def handler(event, context):
    """Обработчик вебхука Telegram бота Нейрофотосессия PRO — генерация и редактирование через 7 AI моделей + AI-промтер"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return ok({'status': 'ok', 'bot': 'neurophoto-pro', 'models': list(MODELS.keys())})

    body = json.loads(event.get('body', '{}'))

    callback = body.get('callback_query')
    if callback:
        return handle_callback(callback)

    message = body.get('message')
    if not message:
        return ok()

    chat_id = message['chat']['id']
    tid = message['from']['id']
    uname = message['from'].get('username', '')
    fname = message['from'].get('first_name', 'User')
    text = message.get('text', '').strip()

    conn = get_db()
    try:
        user = get_user(conn, tid, uname, fname)

        if text == '/start':
            set_session(conn, tid, None)
            model_name = current_model_text(user['model'])
            send_msg(chat_id,
                f'👋 Привет, <b>{fname}</b>!\n\n'
                f'Я бот <b>Нейрофотосессия PRO</b> — создаю и редактирую фото с помощью 7 AI моделей.\n\n'
                f'<b>🚀 Как пользоваться:</b>\n'
                f'📸 Отправьте фото — я спрошу, что изменить\n'
                f'✍️ Напишите текст — создам картинку с нуля\n\n'
                f'🤖 Текущая модель: {model_name}\n'
                f'💎 Генераций: <b>{remaining(user)}</b>',
                reply_markup=start_keyboard()
            )
            return ok()

        if text == '/help':
            send_msg(chat_id,
                '📖 <b>Как пользоваться:</b>\n\n'
                '1️⃣ Отправьте фото → бот спросит, что изменить\n'
                '2️⃣ Напишите описание → бот отредактирует\n'
                '3️⃣ Или просто текст → бот создаст картинку с нуля\n\n'
                '<b>Команды:</b>\n'
                '/start — главное меню\n'
                '/model — выбрать AI модель\n'
                '/prompt — AI составит промпт\n'
                '/balance — проверить баланс',
                reply_markup=start_keyboard()
            )
            return ok()

        if text == '/model':
            model_name = current_model_text(user['model'])
            send_msg(chat_id,
                f'🤖 Текущая модель: {model_name}\n\nВыберите модель:',
                reply_markup=model_keyboard()
            )
            return ok()

        if text == '/prompt':
            send_msg(chat_id,
                '✨ <b>AI-промтер</b>\n\n'
                'Выберите модель, для которой нужен промпт:',
                reply_markup=prompt_model_keyboard()
            )
            return ok()

        if text == '/balance':
            model_name = current_model_text(user['model'])
            send_msg(chat_id,
                f'💎 <b>Баланс:</b>\n'
                f'Бесплатных: {user["free"]}\n'
                f'Оплаченных: {user["paid"]}\n'
                f'Использовано: {user["used"]}\n'
                f'<b>Осталось: {remaining(user)}</b>\n\n'
                f'🤖 Модель: {model_name}'
            )
            return ok()

        photos = message.get('photo', [])
        if photos:
            if remaining(user) <= 0:
                send_msg(chat_id, '❌ Генерации закончились. Обратитесь к администратору.')
                return ok()

            largest = max(photos, key=lambda p: p.get('file_size', 0))
            caption = message.get('caption', '').strip()

            if caption:
                photo_bytes = download_tg_file(largest['file_id'])
                if not photo_bytes:
                    send_msg(chat_id, '❌ Не удалось загрузить фото. Попробуйте ещё раз.')
                    return ok()
                do_generate(conn, chat_id, tid, user, caption, photo_bytes)
            else:
                r = tg('getFile', {'file_id': largest['file_id']})
                if r.get('ok'):
                    fp = r['result']['file_path']
                    photo_url = f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fp}'
                    set_session(conn, tid, 'waiting_prompt', photo_url)
                    send_msg(chat_id, f'📸 Фото получено! Напишите, что нужно изменить.\n\n🤖 Модель: {current_model_text(user["model"])}\n\n<i>Например: Сделай фон осенним</i>')
                else:
                    send_msg(chat_id, '❌ Не удалось получить фото.')
            return ok()

        if text and not text.startswith('/'):
            state = user.get('state', '')

            if state and state.startswith('prompt_wait:'):
                model_key = state.split(':', 1)[1]
                model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

                tg('sendChatAction', {'chat_id': chat_id, 'action': 'typing'})
                send_msg(chat_id, '🧠 AI составляет промпт...')

                generated_prompt, err = openrouter_generate_prompt(model_key, text)

                if err:
                    send_msg(chat_id, f'❌ {err}')
                else:
                    send_msg(chat_id,
                        f'✨ <b>Промпт для {model_info["name"]}:</b>\n\n'
                        f'<code>{generated_prompt}</code>\n\n'
                        f'📋 Скопируйте промпт и отправьте мне — я сгенерирую картинку!\n'
                        f'Или отправьте фото с этим промптом в подписи.',
                        reply_markup={'inline_keyboard': [
                            [{'text': '🔄 Переделать промпт', 'callback_data': f'promptfor:{model_key}'}],
                            [{'text': '🏠 Главное меню', 'callback_data': 'go_start'}]
                        ]}
                    )

                set_session(conn, tid, None)
                return ok()

            if remaining(user) <= 0:
                send_msg(chat_id, '❌ Генерации закончились.')
                return ok()

            if state == 'waiting_prompt' and user.get('photo'):
                photo_bytes = download_url(user['photo'])
                if not photo_bytes:
                    send_msg(chat_id, '❌ Фото устарело. Отправьте его ещё раз.')
                    set_session(conn, tid, None)
                    return ok()
                do_generate(conn, chat_id, tid, user, text, photo_bytes)
            else:
                do_generate(conn, chat_id, tid, user, text)
            return ok()

        return ok()

    except Exception as e:
        try:
            send_msg(chat_id, '⚠️ Произошла ошибка. Попробуйте ещё раз через минуту.')
        except Exception:
            pass
        return ok({'ok': True, 'error': str(e)})
    finally:
        conn.close()


def handle_callback(callback):
    cb_data = callback.get('data', '')
    cb_id = callback['id']
    chat_id = callback['message']['chat']['id']
    msg_id = callback['message']['message_id']
    tid = callback['from']['id']

    if cb_data == 'go_start':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        conn = get_db()
        try:
            uname = callback['from'].get('username', '')
            fname = callback['from'].get('first_name', 'User')
            user = get_user(conn, tid, uname, fname)
            set_session(conn, tid, None)
            model_name = current_model_text(user['model'])
            tg('editMessageText', {
                'chat_id': chat_id,
                'message_id': msg_id,
                'text': (
                    f'👋 <b>Главное меню</b>\n\n'
                    f'📸 Отправьте фото — я спрошу, что изменить\n'
                    f'✍️ Напишите текст — создам картинку с нуля\n\n'
                    f'🤖 Модель: {model_name}\n'
                    f'💎 Генераций: <b>{remaining(user)}</b>'
                ),
                'parse_mode': 'HTML',
                'reply_markup': start_keyboard()
            })
        finally:
            conn.close()
        return ok()

    if cb_data == 'show_models':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        kb = model_keyboard()
        kb['inline_keyboard'].append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': '🤖 <b>Выберите модель для генерации:</b>',
            'parse_mode': 'HTML',
            'reply_markup': kb
        })
        return ok()

    if cb_data == 'show_info':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        kb = info_model_keyboard()
        kb['inline_keyboard'].append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': '📖 <b>Инструкция по моделям</b>\n\nВыберите модель, чтобы узнать подробности:',
            'parse_mode': 'HTML',
            'reply_markup': kb
        })
        return ok()

    if cb_data == 'show_prompt':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        kb = prompt_model_keyboard()
        kb['inline_keyboard'].append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': '✨ <b>AI-промтер</b>\n\nAI составит оптимальный промпт для выбранной модели.\n\nВыберите модель:',
            'parse_mode': 'HTML',
            'reply_markup': kb
        })
        return ok()

    if cb_data.startswith('info:'):
        model_key = cb_data.split(':', 1)[1]
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        instruction = MODEL_INSTRUCTIONS.get(model_key, 'Информация недоступна.')
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': instruction,
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [
                [{'text': '📖 Другие модели', 'callback_data': 'show_info'}],
                [{'text': '🏠 Главное меню', 'callback_data': 'go_start'}]
            ]}
        })
        return ok()

    if cb_data.startswith('promptfor:'):
        model_key = cb_data.split(':', 1)[1]
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

        conn = get_db()
        try:
            set_session(conn, tid, f'prompt_wait:{model_key}')
        finally:
            conn.close()

        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': (
                f'✨ <b>AI-промтер для {model_info["name"]}</b>\n\n'
                f'Опишите своими словами, какую картинку хотите получить.\n\n'
                f'<i>Например:\n'
                f'• Кот в костюме космонавта\n'
                f'• Девушка на фоне осеннего парка\n'
                f'• Закат над горами в стиле масляной живописи</i>\n\n'
                f'Напишите описание:'
            ),
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [
                [{'text': '🏠 Отмена', 'callback_data': 'go_start'}]
            ]}
        })
        return ok()

    if cb_data.startswith('model:'):
        model_key = cb_data.split(':', 1)[1]
        if model_key not in MODELS:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Неизвестная модель'})
            return ok()

        conn = get_db()
        try:
            set_model(conn, tid, model_key)
        finally:
            conn.close()

        model_info = MODELS[model_key]
        tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Выбрана: {model_info["name"]}'})
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': f'✅ Модель установлена: {model_info["name"]}\n<i>{model_info["desc"][:100]}</i>\n\nОтправьте фото или текст для генерации!',
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [
                [{'text': '🏠 Главное меню', 'callback_data': 'go_start'}]
            ]}
        })

    return ok()
