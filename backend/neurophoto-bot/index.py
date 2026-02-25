"""Бот Нейрофотосессия PRO — генерация и редактирование фото через 7 AI моделей"""

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

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

MODELS = {
    'gemini': {
        'name': '🟢 Gemini Flash (Google)',
        'api_id': 'gemini-2.5-flash-preview-image-generation',
        'provider': 'gemini',
        'desc': 'Быстрая, хорошее качество'
    },
    'nano-banana': {
        'name': '🍌 Nano Banana Pro Edit',
        'api_id': 'img2img-google/nano-banana-pro-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Google, мульти-редактирование'
    },
    'flux-klein': {
        'name': '⚡ FLUX 2 Klein 4B',
        'api_id': 'img2img-flux/flux-2-klein-4b',
        'provider': 'vsegpt',
        'desc': 'Компактная FLUX модель'
    },
    'seedream': {
        'name': '🌱 Seedream v4.5 Edit',
        'api_id': 'img2img-bytedance/seedream-v4.5-edit-multi',
        'provider': 'vsegpt',
        'desc': 'ByteDance, мульти-редактирование'
    },
    'reve': {
        'name': '✨ Reve Fast Edit',
        'api_id': 'img2img-reve-fast-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Быстрое редактирование'
    },
    'chrono': {
        'name': '🧠 Chrono Edit Thinking',
        'api_id': 'img2img-nvidia/chrono-edit-thinking',
        'provider': 'vsegpt',
        'desc': 'NVIDIA, думающая модель'
    },
    'flash-25': {
        'name': '💎 Flash 2.5 Edit (Google)',
        'api_id': 'img2img-google/flash-25-edit-multi',
        'provider': 'vsegpt',
        'desc': 'Google Flash, мульти-редактирование'
    }
}

DEFAULT_MODEL = 'gemini'


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

    content_parts = []
    if photo_bytes:
        b64 = base64.b64encode(photo_bytes).decode('utf-8')
        content_parts.append({
            'type': 'image_url',
            'image_url': {'url': f'data:image/jpeg;base64,{b64}'}
        })
    content_parts.append({'type': 'text', 'text': prompt})

    payload = json.dumps({
        'model': api_model,
        'messages': [{'role': 'user', 'content': content_parts}],
        'max_tokens': 4096
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.vsegpt.ru/v1/chat/completions',
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

    choices = result.get('choices', [])
    if not choices:
        return None, 'Пустой ответ от VseGPT'

    message = choices[0].get('message', {})
    content = message.get('content', '')

    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict):
                if part.get('type') == 'image_url':
                    img_url = part.get('image_url', {})
                    url_val = img_url.get('url', '') if isinstance(img_url, dict) else str(img_url)
                    if url_val:
                        if url_val.startswith('data:image'):
                            header, data = url_val.split(',', 1)
                            return base64.b64decode(data), None
                        img_data = download_url(url_val)
                        if img_data:
                            return img_data, None
                elif part.get('type') == 'image':
                    url_val = part.get('url', '') or part.get('image_url', {}).get('url', '')
                    if url_val:
                        img_data = download_url(url_val)
                        if img_data:
                            return img_data, None

    if isinstance(content, str):
        if content.startswith('data:image'):
            header, data = content.split(',', 1)
            return base64.b64decode(data), None
        if content.startswith('http'):
            img_data = download_url(content)
            if img_data:
                return img_data, None

    images = message.get('images', [])
    if images:
        url_val = images[0] if isinstance(images[0], str) else images[0].get('url', '')
        if url_val:
            if url_val.startswith('data:image'):
                header, data = url_val.split(',', 1)
                return base64.b64decode(data), None
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


def current_model_text(model_key):
    info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])
    return f"{info['name']}"


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
    """Обработчик вебхука Telegram бота Нейрофотосессия PRO — генерация и редактирование изображений через 7 AI моделей"""
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
                f'📸 <b>Отправьте фото</b> — я спрошу, что изменить\n'
                f'✍️ <b>Напишите текст</b> — создам картинку с нуля\n\n'
                f'🤖 Текущая модель: {model_name}\n'
                f'💎 Генераций: <b>{remaining(user)}</b>\n\n'
                f'/model — сменить модель\n'
                f'/help — помощь\n'
                f'/balance — баланс'
            )
            return ok()

        if text == '/help':
            send_msg(chat_id,
                '📖 <b>Как пользоваться:</b>\n\n'
                '1️⃣ Отправьте фото → бот спросит, что изменить\n'
                '2️⃣ Напишите описание → бот отредактирует\n'
                '3️⃣ Или просто текст → бот создаст картинку с нуля\n\n'
                '<b>Команды:</b>\n'
                '/model — выбрать AI модель\n'
                '/balance — проверить баланс\n\n'
                '<b>7 моделей:</b>\n'
                '🟢 Gemini Flash — быстрая, от Google\n'
                '🍌 Nano Banana — мульти-редактирование\n'
                '⚡ FLUX Klein — компактная FLUX\n'
                '🌱 Seedream — от ByteDance\n'
                '✨ Reve Fast — быстрое редактирование\n'
                '🧠 Chrono Thinking — NVIDIA, думает\n'
                '💎 Flash 2.5 — Google Flash мульти\n\n'
                '<b>Примеры промптов:</b>\n'
                '• Сделай фон осенним\n'
                '• Преврати в акварель\n'
                '• Портрет в стиле аниме\n'
                '• Закат на берегу океана'
            )
            return ok()

        if text == '/model':
            model_name = current_model_text(user['model'])
            send_msg(chat_id,
                f'🤖 Текущая модель: {model_name}\n\nВыберите модель:',
                reply_markup=model_keyboard()
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
            if remaining(user) <= 0:
                send_msg(chat_id, '❌ Генерации закончились.')
                return ok()

            if user.get('state') == 'waiting_prompt' and user.get('photo'):
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
            'text': f'✅ Модель установлена: {model_info["name"]}\n<i>{model_info["desc"]}</i>',
            'parse_mode': 'HTML'
        })

    return ok()
