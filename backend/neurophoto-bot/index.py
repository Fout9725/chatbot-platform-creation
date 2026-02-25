"""Бот Нейрофотосессия PRO — обработчик Telegram вебхука"""

import json
import os
import base64
import time
import urllib.request
import psycopg2
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BOT_TOKEN = os.environ.get('NEUROPHOTO_BOT_TOKEN', '')
GEMINI_KEY = os.environ.get('GEMINI_API_KEY', '')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

GEMINI_MODEL = 'gemini-2.5-flash-preview-image-generation'

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

    url = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}'
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


def get_user(conn, tid, uname, fname):
    cur = conn.cursor()
    cur.execute(
        f"SELECT telegram_id, free_generations, paid_generations, total_used, preferred_model, session_state, session_photo_url FROM {SCHEMA}.neurophoto_users WHERE telegram_id = %s",
        (tid,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        return {'tid': row[0], 'free': row[1], 'paid': row[2], 'used': row[3], 'model': row[4], 'state': row[5], 'photo': row[6]}

    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_users (telegram_id, username, first_name, free_generations, paid_generations) VALUES (%s, %s, %s, 3, 0)",
        (tid, uname or '', fname or 'User')
    )
    cur.close()
    return {'tid': tid, 'free': 3, 'paid': 0, 'used': 0, 'model': 'gemini-2.5-flash-image', 'state': None, 'photo': None}


def set_session(conn, tid, state, photo=None):
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET session_state = %s, session_photo_url = %s, session_updated_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (state, photo, tid)
    )
    cur.close()


def record_gen(conn, tid, prompt, model, url, is_paid):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_generations (telegram_id, prompt, model, image_url, is_paid) VALUES (%s, %s, %s, %s, %s)",
        (tid, prompt[:500], model, url, is_paid)
    )
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET total_used = total_used + 1, last_generation_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (tid,)
    )
    cur.close()


def remaining(u):
    return u['free'] + u['paid'] - u['used']


def do_generate(conn, chat_id, tid, user, prompt, photo_bytes=None):
    tg('sendChatAction', {'chat_id': chat_id, 'action': 'upload_photo'})
    send_msg(chat_id, '🎨 Генерирую изображение... Обычно это 15-60 секунд.')

    img_bytes, err = gemini_generate(prompt, photo_bytes)

    if err:
        send_msg(chat_id, f'❌ {err}')
        set_session(conn, tid, None)
        return

    fname = f'{tid}_{int(time.time())}.png'
    cdn_url = upload_s3(img_bytes, fname)

    res = send_photo_url(chat_id, cdn_url, f'✨ Готово! Осталось генераций: <b>{remaining(user) - 1}</b>')
    if not res.get('ok'):
        send_photo_bytes(chat_id, img_bytes, f'✨ Готово!')

    record_gen(conn, tid, prompt, user.get('model', 'gemini'), cdn_url, user['paid'] > 0)
    set_session(conn, tid, None)


def handler(event, context):
    """Обработчик вебхука Telegram бота Нейрофотосессия PRO — генерация и редактирование изображений через Gemini AI"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return ok({'status': 'ok', 'bot': 'neurophoto-pro'})

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
            send_msg(chat_id,
                f'👋 Привет, <b>{fname}</b>!\n\n'
                f'Я бот <b>Нейрофотосессия PRO</b> — создаю и редактирую изображения с помощью AI.\n\n'
                f'📸 <b>Отправьте фото</b> — я спрошу, что изменить\n'
                f'✍️ <b>Напишите текст</b> — я создам картинку с нуля\n\n'
                f'💎 Генераций: <b>{remaining(user)}</b>\n\n'
                f'/help — помощь\n/balance — баланс'
            )
            return ok()

        if text == '/help':
            send_msg(chat_id,
                '📖 <b>Как пользоваться:</b>\n\n'
                '1️⃣ Отправьте фото — бот спросит, что изменить\n'
                '2️⃣ Напишите описание — бот отредактирует\n'
                '3️⃣ Или просто текст — бот создаст картинку\n\n'
                '<b>Примеры:</b>\n'
                '• Сделай фон осенним\n'
                '• Преврати в акварель\n'
                '• Портрет в стиле аниме\n'
                '• Закат на берегу океана'
            )
            return ok()

        if text == '/balance':
            send_msg(chat_id,
                f'💎 <b>Баланс:</b>\n'
                f'Бесплатных: {user["free"]}\n'
                f'Оплаченных: {user["paid"]}\n'
                f'Использовано: {user["used"]}\n'
                f'<b>Осталось: {remaining(user)}</b>'
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
                    send_msg(chat_id, '📸 Фото получено! Напишите, что нужно изменить.\n\n<i>Например: Сделай фон осенним</i>')
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

    if cb_data.startswith('model:'):
        model_id = cb_data.split(':', 1)[1]
        tid = callback['from']['id']
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.neurophoto_users SET preferred_model = %s WHERE telegram_id = %s", (model_id, tid))
            cur.close()
        finally:
            conn.close()

        tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Модель обновлена!'})
        tg('editMessageText', {
            'chat_id': callback['message']['chat']['id'],
            'message_id': callback['message']['message_id'],
            'text': f'✅ Модель обновлена',
            'parse_mode': 'HTML'
        })

    return ok()
