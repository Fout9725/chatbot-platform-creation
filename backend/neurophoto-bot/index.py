"""Бот Нейрофотосессия PRO — генерация и редактирование фото через AI моделей + AI-промтер"""

import json
import os
import base64
import time
import urllib.request
import urllib.error

import psycopg2
import boto3
from PIL import Image
import io

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
        'mode': 'both',
        'desc': 'Быстрая, хорошее качество',
        'prompt_tips': 'Понимает русский и английский. Детальные описания, стиль, настроение. Пример: "Портрет девушки в осеннем парке, мягкий свет, тёплые тона"'
    },
    'nano-banana': {
        'name': '🍌 Nano Banana Pro Edit',
        'api_id': 'img2img-google/nano-banana-pro-edit-multi',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'Google, мульти-редактирование',
        'multi_photo': True,
        'prompt_tips': 'Английские промпты. Несколько инструкций через запятую. Поддерживает несколько фото для объединения. Пример: "change background to sunset, add sunglasses, make hair blonde"'
    },
    'flux-klein': {
        'name': '⚡ FLUX 2 Klein 4B',
        'api_id': 'img2img-flux/flux-2-klein-4b',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'Компактная FLUX модель',
        'multi_photo': True,
        'prompt_tips': 'Английские промпты. Фотореализм. Поддерживает несколько фото для объединения. Пример: "a portrait of woman in autumn park, golden leaves, soft lighting, 4k, photorealistic"'
    },
    'seedream': {
        'name': '🌱 Seedream v4.5 Edit',
        'api_id': 'img2img-bytedance/seedream-v4.5-edit-multi',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'ByteDance, мульти-редактирование',
        'prompt_tips': 'Английские промпты. Сильна в стилизации. Пример: "convert to watercolor painting", "make it look like anime"'
    },
    'reve': {
        'name': '✨ Reve Fast Edit',
        'api_id': 'img2img-reve-fast-edit-multi',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'Быстрое редактирование',
        'prompt_tips': 'Короткие чёткие промпты на английском. Одно изменение. Пример: "change background to blue sky", "add red hat"'
    },
    'chrono': {
        'name': '🧠 Chrono Edit Thinking',
        'api_id': 'img2img-nvidia/chrono-edit-thinking',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'NVIDIA, думающая модель',
        'prompt_tips': 'Подробные промпты на английском. Пример: "carefully replace the sky with dramatic storm clouds while preserving lighting"'
    },
    'flash-25': {
        'name': '💎 Flash 2.5 Edit (Google)',
        'api_id': 'img2img-google/flash-25-edit-multi',
        'provider': 'vsegpt',
        'mode': 'img2img',
        'desc': 'Google Flash, мульти-редактирование',
        'prompt_tips': 'Английские промпты. Сложные мульти-инструкции. Пример: "change hair to platinum blonde, add studio lighting, smooth skin"'
    },
    'txt-flux-klein-9b': {
        'name': '⚡ FLUX 2 Klein 9B',
        'api_id': 'img-flux/flux-2-klein-9b',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'FLUX 9B — качественная генерация по тексту',
        'prompt_tips': 'Английские промпты. Фотореализм, детальные описания. Пример: "a portrait of woman in autumn park, golden leaves, soft lighting, 4k"'
    },
    'txt-flux-klein-4b': {
        'name': '⚡ FLUX 2 Klein 4B',
        'api_id': 'img-flux/flux-2-klein-4b',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'FLUX 4B — быстрая генерация по тексту',
        'prompt_tips': 'Английские промпты. Быстрая генерация. Пример: "cat astronaut floating in space, studio photo, 8k"'
    },
    'txt-seedream': {
        'name': '🌱 Seedream v4.5',
        'api_id': 'img-bytedance/seedream-v4.5',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'ByteDance — стилизация и арт по тексту',
        'prompt_tips': 'Английские промпты. Стилизация, арт. Пример: "watercolor painting of sunset over mountains"'
    },
    'txt-flux-pro': {
        'name': '🔥 FLUX 2 Pro',
        'api_id': 'img-flux/flux-2-pro',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'FLUX Pro — максимальное качество',
        'prompt_tips': 'Английские промпты. Максимальное качество. Пример: "hyperrealistic portrait, dramatic lighting, 8k resolution"'
    },
    'txt-nano-banana': {
        'name': '🍌 Nano Banana Pro',
        'api_id': 'img-google/nano-banana-pro',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'Google — генерация по тексту',
        'prompt_tips': 'Английские промпты. Пример: "beautiful landscape, cherry blossom, Japanese garden"'
    },
    'txt-flash-25': {
        'name': '💎 Flash 2.5',
        'api_id': 'img-google/flash-25',
        'provider': 'vsegpt',
        'mode': 'text2img',
        'desc': 'Google Flash — быстрая генерация по тексту',
        'prompt_tips': 'Английские промпты. Пример: "professional headshot photo, studio lighting, clean background"'
    },
}

DEFAULT_MODEL = 'gemini'

MODEL_INSTRUCTIONS = {
    'gemini': (
        '🟢 <b>Gemini Flash (Google)</b>\n\n'
        '<b>Тип:</b> Генерация по тексту + редактирование фото\n'
        '<b>Язык:</b> Русский и английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Создавать изображения с нуля\n'
        '• Редактировать загруженные фото\n'
        '• Менять фон, стиль, добавлять элементы\n\n'
        '<b>Лучше всего для:</b> Первого знакомства, простых задач, русскоязычных промптов\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Нет ограничений — работает и с текстом, и с фото\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Сделай фон осенним парком\n'
        '• Преврати в акварельную картину\n'
        '• Нарисуй кота в космосе</i>'
    ),
    'nano-banana': (
        '🍌 <b>Nano Banana Pro Edit</b>\n\n'
        '<b>Тип:</b> Мульти-редактирование\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n'
        '📸 <b>Поддержка нескольких фото!</b>\n\n'
        '<b>Что умеет:</b>\n'
        '• Менять несколько элементов сразу\n'
        '• Объединять несколько фото в одну картинку\n'
        '• Работа с портретами и пейзажами\n'
        '• Точечные правки на фото\n\n'
        '<b>Лучше всего для:</b> Комплексного редактирования, объединения фото\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Change background to sunset, add sunglasses\n'
        '• Combine these photos into one image\n'
        '• Remove text, improve quality</i>'
    ),
    'flux-klein': (
        '⚡ <b>FLUX 2 Klein 4B</b>\n\n'
        '<b>Тип:</b> Генерация изображений\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n'
        '📸 <b>Поддержка нескольких фото!</b>\n\n'
        '<b>Что умеет:</b>\n'
        '• Фотореалистичные изображения\n'
        '• Объединять несколько фото в одну\n'
        '• Портреты, пейзажи, предметы\n'
        '• Хорошая детализация\n\n'
        '<b>Лучше всего для:</b> Реалистичных изображений, объединения фото\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Combine these two photos into one portrait\n'
        '• A portrait in autumn park, golden leaves, soft light\n'
        '• Cat wearing a tiny hat, studio photo</i>'
    ),
    'seedream': (
        '🌱 <b>Seedream v4.5 Edit (ByteDance)</b>\n\n'
        '<b>Тип:</b> Мульти-редактирование + стилизация\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (20-40 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Художественная стилизация\n'
        '• Мульти-редактирование\n'
        '• Понимание стилей (акварель, аниме, масло)\n\n'
        '<b>Лучше всего для:</b> Стилизации под арт, аниме, живопись\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Convert to watercolor painting\n'
        '• Make it look like anime character\n'
        '• Oil painting style, renaissance</i>'
    ),
    'reve': (
        '✨ <b>Reve Fast Edit</b>\n\n'
        '<b>Тип:</b> Быстрое редактирование\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Очень быстрая (5-15 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Простые быстрые правки\n'
        '• Смена цветов и фона\n'
        '• Добавление/удаление элементов\n\n'
        '<b>Лучше всего для:</b> Быстрых простых правок\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Change background to blue sky\n'
        '• Add red hat\n'
        '• Remove glasses</i>'
    ),
    'chrono': (
        '🧠 <b>Chrono Edit Thinking (NVIDIA)</b>\n\n'
        '<b>Тип:</b> Интеллектуальное редактирование\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Медленная (30-60 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Анализирует фото перед редактированием\n'
        '• Сложные комплексные правки\n'
        '• Сохранение деталей\n\n'
        '<b>Лучше всего для:</b> Сложных задач, где важна точность\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Carefully replace sky with dramatic storm clouds\n'
        '• Transform into professional headshot\n'
        '• Age the person by 20 years realistically</i>'
    ),
    'flash-25': (
        '💎 <b>Flash 2.5 Edit (Google)</b>\n\n'
        '<b>Тип:</b> Продвинутое мульти-редактирование\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Сложные мульти-инструкции\n'
        '• Высокое качество обработки\n'
        '• Сохранение идентичности лица\n\n'
        '<b>Лучше всего для:</b> Профессиональной обработки портретов\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Требуется загрузить фото для редактирования\n'
        '⚠️ Не генерирует с нуля по тексту\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Change hair to platinum blonde, add studio lighting\n'
        '• Professional retouching, smooth skin, subtle makeup\n'
        '• Place person in Paris with Eiffel Tower</i>'
    ),
    'txt-flux-klein-9b': (
        '⚡ <b>FLUX 2 Klein 9B</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Генерация изображений по текстовому описанию\n'
        '• Фотореалистичные портреты и пейзажи\n'
        '• Высокая детализация\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• A portrait of woman in autumn park, golden leaves\n'
        '• Futuristic city at night, neon lights, cyberpunk\n'
        '• Cat wearing a tiny hat, studio photo</i>'
    ),
    'txt-flux-klein-4b': (
        '⚡ <b>FLUX 2 Klein 4B</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Быстрая генерация по описанию\n'
        '• Хорошее качество при высокой скорости\n'
        '• Портреты, пейзажи, предметы\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Cat astronaut floating in space, studio photo\n'
        '• Beautiful sunset over ocean, cinematic\n'
        '• Cozy coffee shop interior, warm lighting</i>'
    ),
    'txt-seedream': (
        '🌱 <b>Seedream v4.5 (ByteDance)</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (15-30 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Художественная генерация\n'
        '• Стилизация: акварель, масло, аниме\n'
        '• Красивые арт-работы\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Watercolor painting of sunset over mountains\n'
        '• Anime girl in cherry blossom garden\n'
        '• Oil painting, renaissance style portrait</i>'
    ),
    'txt-flux-pro': (
        '🔥 <b>FLUX 2 Pro</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Средняя (20-40 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Максимальное качество генерации\n'
        '• Фотореализм высочайшего уровня\n'
        '• Сложные сцены и композиции\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Hyperrealistic portrait, dramatic lighting, 8k\n'
        '• Photorealistic landscape, mountain lake, golden hour\n'
        '• Professional product photo, minimal background</i>'
    ),
    'txt-nano-banana': (
        '🍌 <b>Nano Banana Pro (Google)</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Генерация по текстовому описанию\n'
        '• Хорошая работа с лицами\n'
        '• Стабильное качество\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Beautiful landscape, cherry blossom, Japanese garden\n'
        '• Portrait of young woman, natural lighting\n'
        '• Cute puppy in a flower field</i>'
    ),
    'txt-flash-25': (
        '💎 <b>Flash 2.5 (Google)</b>\n\n'
        '<b>Режим:</b> Генерация по тексту\n'
        '<b>Язык:</b> Английский\n'
        '<b>Скорость:</b> Быстрая (10-20 сек)\n\n'
        '<b>Что умеет:</b>\n'
        '• Быстрая генерация по описанию\n'
        '• Портреты, предметы, сцены\n'
        '• Google качество\n\n'
        '<b>Ограничения:</b>\n'
        '⚠️ Не работает с загруженными фото\n'
        '⚠️ Только английские промпты\n\n'
        '<b>Примеры:</b>\n'
        '<i>• Professional headshot, studio lighting\n'
        '• Modern interior design, minimalist\n'
        '• Food photography, appetizing dish</i>'
    ),
}


def ok(data=None):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data or {'ok': True})}


def get_db():
    c = psycopg2.connect(os.environ['DATABASE_URL'])
    c.autocommit = True
    return c


def is_update_processed(conn, update_id):
    cur = conn.cursor()
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.neurophoto_processed_updates WHERE update_id = %s",
        (update_id,)
    )
    exists = cur.fetchone() is not None
    cur.close()
    return exists


def mark_update_processed(conn, update_id):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_processed_updates (update_id) VALUES (%s) ON CONFLICT DO NOTHING",
        (update_id,)
    )
    cur.close()


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


def send_photo_url(chat_id, photo_url, caption='', reply_markup=None):
    d = {'chat_id': chat_id, 'photo': photo_url}
    if caption:
        d['caption'] = caption
        d['parse_mode'] = 'HTML'
    if reply_markup:
        d['reply_markup'] = reply_markup
    return tg('sendPhoto', d)


def send_photo_bytes(chat_id, img_bytes, caption='', reply_markup=None):
    boundary = f'----NeuroBotBoundary{int(time.time())}'
    enc = 'utf-8'
    if caption:
        caption = caption.encode(enc, errors='replace').decode(enc)
    body = b''
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n'.encode(enc)
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="result.png"\r\nContent-Type: image/png\r\n\r\n'.encode(enc)
    body += img_bytes
    body += b'\r\n'
    if caption:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n'.encode(enc)
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n'.encode(enc)
    if reply_markup:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n{json.dumps(reply_markup, ensure_ascii=False)}\r\n'.encode(enc)
    body += f'--{boundary}--\r\n'.encode(enc)

    req = urllib.request.Request(
        f'https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode(enc))
    except Exception as e:
        print(f'[SEND_PHOTO] Error: {e}')
        return {'ok': False, 'error': str(e)}


def download_tg_file(file_id):
    r = tg('getFile', {'file_id': file_id})
    if not r.get('ok'):
        return None
    fp = r['result']['file_path']
    url = f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fp}'
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as resp:
            return resp.read()
    except Exception:
        return None


def download_url(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as resp:
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
        with urllib.request.urlopen(req, timeout=24) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        return None, f'Gemini API error {e.code}: {err_body[:200]}'
    except Exception as e:
        err_str = str(e).lower()
        if 'timed out' in err_str or 'timeout' in err_str:
            return None, 'TIMEOUT'
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


def compress_photo(photo_bytes, max_size=512):
    try:
        img = Image.open(io.BytesIO(photo_bytes))
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        w, h = img.size
        ratio = min(max_size / w, max_size / h)
        if ratio < 1:
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=55)
        result = buf.getvalue()
        print(f'[COMPRESS] {len(photo_bytes)} -> {len(result)} bytes, {img.size}')
        return result
    except Exception as e:
        print(f'[COMPRESS] Failed: {e}, using original')
        return photo_bytes


def vsegpt_generate(model_key, prompt, photo_bytes=None, extra_photos=None, cdn_urls=None):
    if not VSEGPT_KEY:
        return None, 'VSEGPT_API_KEY не настроен'

    model_info = MODELS.get(model_key, {})
    api_model = model_info.get('api_id', '')

    body = {
        'model': api_model,
        'prompt': prompt,
        'response_format': 'b64_json'
    }

    if cdn_urls:
        body['image_url'] = cdn_urls[0]
        for i, curl in enumerate(cdn_urls[1:]):
            body[f'image{i + 2}_url'] = curl
    elif photo_bytes:
        b64 = base64.b64encode(photo_bytes).decode('utf-8')
        body['image_url'] = f'data:image/jpeg;base64,{b64}'
        if extra_photos:
            for i, extra_bytes in enumerate(extra_photos):
                b64_extra = base64.b64encode(extra_bytes).decode('utf-8')
                body[f'image{i + 2}_url'] = f'data:image/jpeg;base64,{b64_extra}'

    payload = json.dumps(body).encode('utf-8')
    print(f'[VSEGPT] payload={len(payload)} bytes, model={api_model}, photos={len(cdn_urls) if cdn_urls else (1 + (len(extra_photos) if extra_photos else 0) if photo_bytes else 0)}')

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
        with urllib.request.urlopen(req, timeout=100) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        print(f'[VSEGPT] HTTP error {e.code}: {err_body[:500]}')
        return None, f'VseGPT error {e.code}: {err_body[:200]}'
    except Exception as e:
        err_str = str(e).lower()
        print(f'[VSEGPT] Exception: {str(e)}')
        if 'timed out' in err_str or 'timeout' in err_str:
            return None, 'Таймаут: нейросеть не ответила за 100 секунд. Попробуйте ещё раз или выберите другую модель.'
        return None, f'Ошибка соединения: {str(e)[:100]}'

    print(f'[VSEGPT] Response keys: {list(result.keys())}')
    data_list = result.get('data', [])
    if not data_list:
        print(f'[VSEGPT] Empty data. Full response: {json.dumps(result)[:500]}')
        return None, 'Пустой ответ от VseGPT. Попробуйте другой промпт.'

    item = data_list[0]
    print(f'[VSEGPT] Item keys: {list(item.keys())}')

    b64_data = item.get('b64_json', '')
    if b64_data:
        return base64.b64decode(b64_data), None

    img_url = item.get('url', '')
    if img_url:
        print(f'[VSEGPT] Got URL response, downloading: {img_url[:100]}')
        img_data = download_url(img_url)
        if img_data:
            return img_data, None
        return None, 'Не удалось скачать изображение по ссылке от VseGPT.'

    print(f'[VSEGPT] No b64_json or url in item. Keys: {list(item.keys())}, values preview: {str(item)[:300]}')
    return None, 'Модель не вернула изображение. Попробуйте другой промпт или модель.'


def generate_image(model_key, prompt, photo_bytes=None, extra_photos=None, cdn_urls=None):
    model_info = MODELS.get(model_key)
    if not model_info:
        return None, f'Неизвестная модель: {model_key}'

    if model_info['provider'] == 'gemini':
        return gemini_generate(prompt, photo_bytes)
    else:
        return vsegpt_generate(model_key, prompt, photo_bytes, extra_photos=extra_photos, cdn_urls=cdn_urls)


def openrouter_make_prompt(model_key, user_description):
    if not OPENROUTER_KEY:
        return None, 'OPENROUTER_API_KEY не настроен'

    model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])
    tips = model_info.get('prompt_tips', '')

    system_prompt = (
        'You are an expert AI image generation prompt engineer. '
        'The user gives you a description in any language. '
        f'Create an optimal prompt for the image generation model "{model_info["name"]}".\n\n'
        f'Model tips: {tips}\n\n'
        'Rules:\n'
        '1. Output ONLY the final prompt, no explanations\n'
        '2. Make it detailed: style, lighting, quality, composition\n'
        '3. For Gemini model — write in Russian if user wrote in Russian\n'
        '4. For all other models — write in English\n'
        '5. Keep under 250 characters\n'
        '6. No quotes around the prompt'
    )

    payload = json.dumps({
        'model': 'nvidia/nemotron-3-nano-30b-a3b:free',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_description}
        ],
        'max_tokens': 2000,
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
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        return None, f'AI error {e.code}: {err_body[:200]}'
    except Exception as e:
        return None, f'Ошибка AI: {str(e)[:100]}'

    print(f'OpenRouter response keys: {list(result.keys())}, choices count: {len(result.get("choices", []))}')

    choices = result.get('choices', [])
    if not choices:
        err_msg = result.get('error', {}).get('message', '')
        if err_msg:
            return None, f'AI ошибка: {err_msg[:200]}'
        return None, 'AI не вернул промпт. Попробуйте ещё раз.'

    choice = choices[0]
    msg = choice.get('message', {})

    content = (msg.get('content') or '').strip()

    if not content:
        reasoning = (msg.get('reasoning') or '').strip()
        if reasoning:
            lines = [l.strip() for l in reasoning.split('\n') if l.strip()]
            for line in reversed(lines):
                clean = line.strip('"').strip("'").strip()
                if len(clean) > 15 and not clean.startswith('We ') and not clean.startswith('The ') and not clean.startswith('According') and not clean.startswith('So ') and not clean.startswith('Rule'):
                    content = clean
                    break
            if not content and lines:
                content = lines[-1].strip('"').strip("'").strip()

    if not content:
        return None, 'Пустой ответ от AI. Попробуйте ещё раз.'

    return content, None


def get_user(conn, tid, uname, fname):
    cur = conn.cursor()
    cur.execute(
        f"SELECT telegram_id, free_generations, paid_generations, total_used, preferred_model, session_state, session_photo_url, session_media_group FROM {SCHEMA}.neurophoto_users WHERE telegram_id = %s",
        (tid,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        model = row[4] or DEFAULT_MODEL
        if model not in MODELS:
            model = DEFAULT_MODEL
        return {'tid': row[0], 'free': row[1], 'paid': row[2], 'used': row[3], 'model': model, 'state': row[5], 'photo': row[6], 'media_group': row[7]}

    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_users (telegram_id, username, first_name, free_generations, paid_generations, preferred_model) VALUES (%s, %s, %s, 3, 0, %s)",
        (tid, uname or '', fname or 'User', DEFAULT_MODEL)
    )
    cur.close()
    return {'tid': tid, 'free': 3, 'paid': 0, 'used': 0, 'model': DEFAULT_MODEL, 'state': None, 'photo': None, 'media_group': None}


def set_session(conn, tid, state, photo=None):
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET session_state = %s, session_photo_url = %s, session_updated_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (state, photo, tid)
    )
    cur.close()


def save_album_photo(conn, tid, media_group_id, photo_url, order_num):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.neurophoto_album_photos (telegram_id, media_group_id, photo_url, photo_order) VALUES (%s, %s, %s, %s)",
        (tid, media_group_id, photo_url, order_num)
    )
    cur.close()


def get_album_photos(conn, tid, media_group_id):
    cur = conn.cursor()
    cur.execute(
        f"SELECT photo_url FROM {SCHEMA}.neurophoto_album_photos WHERE telegram_id = %s AND media_group_id = %s ORDER BY photo_order",
        (tid, media_group_id)
    )
    rows = cur.fetchall()
    cur.close()
    return [r[0] for r in rows]


def set_session_album(conn, tid, state, media_group_id):
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.neurophoto_users SET session_state = %s, session_media_group = %s, session_updated_at = CURRENT_TIMESTAMP WHERE telegram_id = %s",
        (state, media_group_id, tid)
    )
    cur.close()


def get_user_media_group(conn, tid):
    cur = conn.cursor()
    cur.execute(
        f"SELECT session_media_group FROM {SCHEMA}.neurophoto_users WHERE telegram_id = %s",
        (tid,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


MULTI_PHOTO_MODELS = [k for k, v in MODELS.items() if v.get('multi_photo')]


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


def text_model_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        mode = info.get('mode', '')
        if mode in ('text2img', 'both'):
            row.append({'text': info['name'], 'callback_data': f'model:{key}'})
            if len(row) == 2:
                buttons.append(row)
                row = []
    if row:
        buttons.append(row)
    buttons.append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
    return {'inline_keyboard': buttons}


def img_model_keyboard(multi_only=False):
    buttons = []
    row = []
    for key, info in MODELS.items():
        mode = info.get('mode', '')
        if mode in ('img2img', 'both'):
            if multi_only and not info.get('multi_photo'):
                continue
            row.append({'text': info['name'], 'callback_data': f'model:{key}'})
            if len(row) == 2:
                buttons.append(row)
                row = []
    if row:
        buttons.append(row)
    buttons.append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
    return {'inline_keyboard': buttons}


def info_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        row.append({'text': info['name'], 'callback_data': f'info:{key}'})
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
    return {'inline_keyboard': buttons}


def prompt_keyboard():
    buttons = []
    row = []
    for key, info in MODELS.items():
        row.append({'text': info['name'], 'callback_data': f'promptfor:{key}'})
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
    return {'inline_keyboard': buttons}


def current_model_text(model_key):
    info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])
    return f"{info['name']}"


def start_keyboard():
    return {'inline_keyboard': [
        [{'text': '📖 Инструкция по моделям', 'callback_data': 'show_info'}],
        [{'text': '✨ Составить промпт (AI)', 'callback_data': 'show_prompt'}]
    ]}


def after_gen_keyboard():
    return {'inline_keyboard': [
        [{'text': '✏️ Редактировать', 'callback_data': 'after_edit'}, {'text': '🎨 Сменить дизайн', 'callback_data': 'after_redesign'}],
        [{'text': '🤖 Сменить модель', 'callback_data': 'show_img_models'}, {'text': '🏠 На главную', 'callback_data': 'go_start'}]
    ]}


def run_generate_inline(conn, chat_id, tid, prompt, model_key, photo_bytes=None, extra_photos=None, photo_cdn_urls=None):
    model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])
    print(f'[GEN] Starting inline: tid={tid}, model={model_key}, has_photo={photo_bytes is not None}, cdn_urls={len(photo_cdn_urls) if photo_cdn_urls else 0}')

    try:
        gen_photo = photo_bytes
        gen_extra = extra_photos
        vsegpt_cdn = None

        if photo_cdn_urls and model_info['provider'] == 'gemini':
            all_bytes = []
            for url in photo_cdn_urls:
                data = download_url(url)
                if data:
                    all_bytes.append(compress_photo(data))
                else:
                    print(f'[GEN] Failed to download: {url[:80]}')
            if all_bytes:
                gen_photo = all_bytes[0]
                if len(all_bytes) > 1:
                    gen_extra = all_bytes[1:]
            print(f'[GEN] Downloaded {len(all_bytes)} photos for Gemini')
        elif photo_cdn_urls and model_info['provider'] != 'gemini':
            vsegpt_cdn = photo_cdn_urls
            print(f'[GEN] Passing {len(photo_cdn_urls)} CDN URLs directly to VseGPT')
        elif photo_bytes and model_info['provider'] != 'gemini':
            compressed = compress_photo(photo_bytes)
            fname_tmp = f'tmp_{tid}_{int(time.time())}_0.jpg'
            cdn = upload_s3(compressed, fname_tmp)
            vsegpt_cdn = [cdn]
            if extra_photos:
                for i, ep in enumerate(extra_photos):
                    comp = compress_photo(ep)
                    fn = f'tmp_{tid}_{int(time.time())}_{i+1}.jpg'
                    vsegpt_cdn.append(upload_s3(comp, fn))
            gen_photo = None
            gen_extra = None
            print(f'[GEN] Uploaded {len(vsegpt_cdn)} photos to CDN for VseGPT')

        img_bytes_result, err = generate_image(model_key, prompt, gen_photo, extra_photos=gen_extra, cdn_urls=vsegpt_cdn)

        if err:
            print(f'[GEN] Error: {err}')
            send_msg(chat_id, f'\u274c \u041e\u0448\u0438\u0431\u043a\u0430 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0438: {err}\n\n\u041c\u043e\u0434\u0435\u043b\u044c: {model_info["name"]}\n\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043e\u0439 \u043f\u0440\u043e\u043c\u043f\u0442 \u0438\u043b\u0438 \u0441\u043c\u0435\u043d\u0438\u0442\u0435 \u043c\u043e\u0434\u0435\u043b\u044c.')
            set_session(conn, tid, None)
            return

        user = get_user(conn, tid, '', '')
        left = remaining(user) - 1
        caption = f'\u2728 \u0413\u043e\u0442\u043e\u0432\u043e! \u041c\u043e\u0434\u0435\u043b\u044c: {model_info["name"]}\n\ud83d\udc8e \u041e\u0441\u0442\u0430\u043b\u043e\u0441\u044c: <b>{left}</b>'
        kb = after_gen_keyboard()

        print(f'[GEN] Got {len(img_bytes_result)} bytes, sending to Telegram...')
        res = send_photo_bytes(chat_id, img_bytes_result, caption, reply_markup=kb)
        print(f'[GEN] send_photo_bytes result ok={res.get("ok")}')
        if not res.get('ok'):
            fname_fb = f'{tid}_{int(time.time())}_fb.png'
            cdn_fb = upload_s3(img_bytes_result, fname_fb)
            print(f'[GEN] Fallback: sending as URL {cdn_fb[:60]}')
            res2 = send_photo_url(chat_id, cdn_fb, caption, reply_markup=kb)
            if not res2.get('ok'):
                send_msg(chat_id, f'❌ Картинка сгенерирована, но не удалось отправить.\nПричина: {res.get("error", res.get("description", "неизвестно"))[:200]}')

        cdn_url = ''
        try:
            fname_out = f'{tid}_{int(time.time())}.png'
            cdn_url = upload_s3(img_bytes_result, fname_out)
        except Exception as e:
            print(f'[S3] Upload failed: {e}')

        record_gen(conn, tid, prompt, model_key, cdn_url, user['paid'] > 0)
        set_session(conn, tid, 'after_gen', cdn_url or 'generated')
    except Exception as e:
        print(f'[GEN] Fatal error: {type(e).__name__}: {e}')
        try:
            send_msg(chat_id, '\u274c \u041f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u0430 \u043e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.')
            set_session(conn, tid, None)
        except Exception:
            pass


def do_generate(conn, chat_id, tid, user, prompt, photo_bytes=None, extra_photos=None, photo_cdn_urls=None):
    cur = conn.cursor()
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.neurophoto_users WHERE telegram_id = %s AND session_state = 'generating' AND session_updated_at > CURRENT_TIMESTAMP - INTERVAL '120 seconds'",
        (tid,)
    )
    still_generating = cur.fetchone() is not None
    cur.close()
    if still_generating:
        send_msg(chat_id, '\u23f3 \u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0430\u044f \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u0435\u0449\u0451 \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f. \u0414\u043e\u0436\u0434\u0438\u0442\u0435\u0441\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430.')
        return

    set_session(conn, tid, 'generating')

    model_key = user.get('model', DEFAULT_MODEL)
    model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

    tg('sendChatAction', {'chat_id': chat_id, 'action': 'upload_photo'})

    if photo_cdn_urls:
        send_msg(chat_id, f'🎨 Генерирую из {len(photo_cdn_urls)} фото через {model_info["name"]}...\nОбычно 15-60 секунд.')
    else:
        photo_count = 1 + (len(extra_photos) if extra_photos else 0) if photo_bytes else 0
        if photo_count > 1:
            send_msg(chat_id, f'🎨 Генерирую из {photo_count} фото через {model_info["name"]}...\nОбычно 15-60 секунд.')
        else:
            send_msg(chat_id, f'🎨 Генерирую через {model_info["name"]}...\nОбычно 15-60 секунд.')

    run_generate_inline(conn, chat_id, tid, prompt, model_key, photo_bytes, extra_photos, photo_cdn_urls)


def handler(event, context):
    """Обработчик вебхука Telegram бота Нейрофотосессия PRO — генерация и редактирование через AI + AI-промтер"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return ok({'status': 'ok', 'bot': 'neurophoto-pro', 'models': list(MODELS.keys())})

    body = json.loads(event.get('body', '{}'))

    if body.get('_internal') == 'generate':
        print('[HANDLER] Internal generate request (legacy)')
        chat_id = body['chat_id']
        tid = body['tid']
        prompt = body['prompt']
        model_key = body['model_key']
        cdn_urls = body.get('cdn_urls', [])
        conn = get_db()
        try:
            run_generate_inline(conn, chat_id, tid, prompt, model_key, photo_cdn_urls=cdn_urls if cdn_urls else None)
        finally:
            conn.close()
        return ok()

    update_id = body.get('update_id')

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
        if update_id and is_update_processed(conn, update_id):
            return ok()
        if update_id:
            mark_update_processed(conn, update_id)

        media_group_id = message.get('media_group_id')
        if media_group_id:
            photos = message.get('photo', [])
            if photos:
                largest = max(photos, key=lambda p: p.get('file_size', 0))
                photo_data = download_tg_file(largest['file_id'])
                if photo_data:
                    fname_s3 = f'album_{tid}_{media_group_id}_{int(time.time())}_{len(photos)}.jpg'
                    cdn_url = upload_s3(photo_data, fname_s3)
                    existing = get_album_photos(conn, tid, media_group_id)
                    save_album_photo(conn, tid, media_group_id, cdn_url, len(existing))

            cur = conn.cursor()
            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.neurophoto_processed_updates WHERE update_id = -%s",
                (abs(hash(media_group_id)) % 2147483647,)
            )
            already_replied = cur.fetchone() is not None
            cur.close()
            if not already_replied:
                cur2 = conn.cursor()
                cur2.execute(
                    f"INSERT INTO {SCHEMA}.neurophoto_processed_updates (update_id) VALUES (-%s) ON CONFLICT DO NOTHING",
                    (abs(hash(media_group_id)) % 2147483647,)
                )
                cur2.close()

                caption = message.get('caption', '').strip()
                set_session_album(conn, tid, 'album_choose_model', media_group_id)
                if caption:
                    cur_cap = conn.cursor()
                    cur_cap.execute(
                        f"UPDATE {SCHEMA}.neurophoto_users SET session_photo_url = %s WHERE telegram_id = %s",
                        (caption[:500], tid)
                    )
                    cur_cap.close()
                    send_msg(chat_id,
                        f'📸 <b>Получено несколько фото!</b>\n'
                        f'✍️ Промпт: <i>{caption[:150]}</i>\n\n'
                        f'🤖 Выберите нейросеть для обработки:',
                        reply_markup=img_model_keyboard(multi_only=True)
                    )
                else:
                    send_msg(chat_id,
                        '📸 <b>Получено несколько фото!</b>\n\n'
                        '🤖 Выберите нейросеть для обработки:',
                        reply_markup=img_model_keyboard(multi_only=True)
                    )
            return ok()

        user = get_user(conn, tid, uname, fname)

        if text == '/start':
            set_session(conn, tid, None)
            send_msg(chat_id,
                f'👋 Привет, <b>{fname}</b>!\n\n'
                f'Я — <b>Нейрофотосессия PRO</b>, твой AI-ассистент для работы с изображениями.\n\n'
                f'🎨 <b>Что я умею:</b>\n'
                f'• Генерировать картинки по текстовому описанию\n'
                f'• Редактировать и стилизовать загруженные фото\n'
                f'• Объединять несколько фото в одну картинку\n\n'
                f'🚀 <b>Как начать:</b>\n'
                f'✍️ Напишите текст — я предложу нейросети для генерации\n'
                f'📸 Отправьте фото — я предложу нейросети для редактирования\n\n'
                f'💎 Доступно генераций: <b>{remaining(user)}</b>',
                reply_markup=start_keyboard()
            )
            return ok()

        if text == '/help':
            send_msg(chat_id,
                '📖 <b>Как пользоваться:</b>\n\n'
                '1️⃣ Отправьте фото → бот спросит, что изменить\n'
                '2️⃣ Напишите описание → бот отредактирует\n'
                '3️⃣ Или просто текст → создам картинку с нуля\n\n'
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
            kb = model_keyboard()
            kb['inline_keyboard'].append([{'text': '🏠 Назад', 'callback_data': 'go_start'}])
            send_msg(chat_id,
                f'🤖 Текущая модель: {model_name}\n\nВыберите модель:',
                reply_markup=kb
            )
            return ok()

        if text == '/prompt':
            send_msg(chat_id,
                '✨ <b>AI-промтер</b>\n\n'
                'AI составит оптимальный промпт для выбранной модели.\n\n'
                'Выберите модель:',
                reply_markup=prompt_keyboard()
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

            r = tg('getFile', {'file_id': largest['file_id']})
            if not r.get('ok'):
                send_msg(chat_id, '❌ Не удалось получить фото.')
                return ok()
            fp = r['result']['file_path']
            photo_url = f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fp}'

            if caption:
                cur_cap = conn.cursor()
                cur_cap.execute(
                    f"UPDATE {SCHEMA}.neurophoto_users SET session_photo_url = %s WHERE telegram_id = %s",
                    (photo_url, tid)
                )
                cur_cap.close()
                set_session(conn, tid, 'caption_choose_model', photo_url)
                cur_cap2 = conn.cursor()
                cur_cap2.execute(
                    f"UPDATE {SCHEMA}.neurophoto_users SET session_media_group = %s WHERE telegram_id = %s",
                    (caption[:500], tid)
                )
                cur_cap2.close()
                send_msg(chat_id,
                    f'📸 <b>Фото получено!</b>\n'
                    f'✍️ Промпт: <i>{caption[:150]}</i>\n\n'
                    f'🤖 Выберите нейросеть для редактирования:',
                    reply_markup=img_model_keyboard()
                )
            else:
                set_session(conn, tid, 'waiting_prompt', photo_url)
                send_msg(chat_id,
                    '📸 <b>Фото получено!</b>\n\n'
                    '🤖 Выберите нейросеть для редактирования:',
                    reply_markup=img_model_keyboard()
                )
            return ok()

        if text and not text.startswith('/'):
            state = user.get('state') or ''

            if state.startswith('prompt_wait:'):
                model_key = state.split(':', 1)[1]
                model_info = MODELS.get(model_key, MODELS[DEFAULT_MODEL])

                tg('sendChatAction', {'chat_id': chat_id, 'action': 'typing'})
                send_msg(chat_id, '🧠 AI составляет промпт...')

                generated, err = openrouter_make_prompt(model_key, text)
                set_session(conn, tid, None)

                if err:
                    send_msg(chat_id, f'❌ {err}')
                else:
                    send_msg(chat_id,
                        f'✨ <b>Промпт для {model_info["name"]}:</b>\n\n'
                        f'<code>{generated}</code>\n\n'
                        f'📋 Скопируйте и отправьте мне — я сгенерирую картинку!\n'
                        f'Или отправьте фото с этим промптом в подписи.',
                        reply_markup={'inline_keyboard': [
                            [{'text': '🔄 Другой промпт', 'callback_data': f'promptfor:{model_key}'}],
                            [{'text': '✨ Другая модель', 'callback_data': 'show_prompt'}],
                            [{'text': '🏠 Главное меню', 'callback_data': 'go_start'}]
                        ]}
                    )
                return ok()

            if remaining(user) <= 0:
                send_msg(chat_id, '❌ Генерации закончились.')
                return ok()

            if state == 'waiting_album_prompt':
                mg = get_user_media_group(conn, tid)
                if not mg:
                    send_msg(chat_id, '❌ Фото не найдены. Отправьте альбом заново.')
                    set_session(conn, tid, None)
                    return ok()
                cdn_urls = get_album_photos(conn, tid, mg)
                if len(cdn_urls) < 2:
                    send_msg(chat_id, '❌ Фото не найдены. Отправьте альбом заново.')
                    set_session(conn, tid, None)
                    return ok()
                do_generate(conn, chat_id, tid, user, text, photo_cdn_urls=cdn_urls)
                return ok()

            if state == 'waiting_prompt' and user.get('photo'):
                photo_bytes = download_url(user['photo'])
                if not photo_bytes:
                    send_msg(chat_id, '❌ Фото устарело. Отправьте его ещё раз.')
                    set_session(conn, tid, None)
                    return ok()
                do_generate(conn, chat_id, tid, user, text, photo_bytes)
            elif state == 'chosen_img_model' and user.get('photo'):
                photo_bytes = download_url(user['photo'])
                if not photo_bytes:
                    send_msg(chat_id, '❌ Фото устарело. Отправьте его ещё раз.')
                    set_session(conn, tid, None)
                    return ok()
                do_generate(conn, chat_id, tid, user, text, photo_bytes)
            elif state == 'choosing_text_model':
                send_msg(chat_id, '👆 Сначала выберите нейросеть из списка выше.')
            else:
                set_session(conn, tid, 'choosing_text_model')
                cur2 = conn.cursor()
                cur2.execute(
                    f"UPDATE {SCHEMA}.neurophoto_users SET session_photo_url = %s WHERE telegram_id = %s",
                    (text, tid)
                )
                cur2.close()
                send_msg(chat_id,
                    '✍️ <b>Генерация по тексту</b>\n\n'
                    f'Ваш запрос: <i>{text[:200]}</i>\n\n'
                    '🤖 Выберите нейросеть для генерации:',
                    reply_markup=text_model_keyboard()
                )
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
            menu_text = (
                f'👋 <b>Главное меню</b>\n\n'
                f'✍️ Напишите текст — предложу нейросети для генерации\n'
                f'📸 Отправьте фото — предложу нейросети для редактирования\n\n'
                f'💎 Генераций: <b>{remaining(user)}</b>'
            )
            is_photo_msg = bool(callback.get('message', {}).get('photo'))
            if is_photo_msg:
                tg('deleteMessage', {'chat_id': chat_id, 'message_id': msg_id})
                send_msg(chat_id, menu_text, reply_markup=start_keyboard())
            else:
                tg('editMessageText', {
                    'chat_id': chat_id,
                    'message_id': msg_id,
                    'text': menu_text,
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
        is_photo_msg = bool(callback.get('message', {}).get('photo'))
        if is_photo_msg:
            tg('deleteMessage', {'chat_id': chat_id, 'message_id': msg_id})
            send_msg(chat_id, '🤖 <b>Все модели:</b>', reply_markup=kb)
        else:
            tg('editMessageText', {
                'chat_id': chat_id,
                'message_id': msg_id,
                'text': '🤖 <b>Все модели:</b>',
                'parse_mode': 'HTML',
                'reply_markup': kb
            })
        return ok()

    if cb_data == 'show_img_models':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        kb = img_model_keyboard()
        is_photo_msg = bool(callback.get('message', {}).get('photo'))
        if is_photo_msg:
            tg('deleteMessage', {'chat_id': chat_id, 'message_id': msg_id})
            send_msg(chat_id, '🤖 <b>Выберите модель для редактирования фото:</b>', reply_markup=kb)
        else:
            tg('editMessageText', {
                'chat_id': chat_id,
                'message_id': msg_id,
                'text': '🤖 <b>Выберите модель для редактирования фото:</b>',
                'parse_mode': 'HTML',
                'reply_markup': kb
            })
        return ok()

    if cb_data == 'show_text_models':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        kb = text_model_keyboard()
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': '🤖 <b>Выберите модель для генерации по тексту:</b>',
            'parse_mode': 'HTML',
            'reply_markup': kb
        })
        return ok()

    if cb_data == 'show_info':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': '📖 <b>Инструкция по моделям</b>\n\nВыберите модель, чтобы узнать подробности:',
            'parse_mode': 'HTML',
            'reply_markup': info_keyboard()
        })
        return ok()

    if cb_data == 'show_prompt':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        tg('editMessageText', {
            'chat_id': chat_id,
            'message_id': msg_id,
            'text': (
                '✨ <b>AI-промтер</b>\n\n'
                'AI составит оптимальный промпт для выбранной нейросети.\n\n'
                'Выберите модель:'
            ),
            'parse_mode': 'HTML',
            'reply_markup': prompt_keyboard()
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
                f'Опишите своими словами, какую картинку хотите.\n\n'
                f'<i>Примеры:\n'
                f'• Кот в костюме космонавта\n'
                f'• Девушка на фоне осеннего парка\n'
                f'• Закат над горами в стиле масляной живописи</i>\n\n'
                f'✏️ Напишите описание:'
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
            uname = callback['from'].get('username', '')
            fname = callback['from'].get('first_name', 'User')
            user = get_user(conn, tid, uname, fname)
            set_model(conn, tid, model_key)

            state = user.get('state', '') or ''
            saved_prompt = user.get('photo', '')

            if state == 'album_choose_model':
                mg = user.get('media_group', '')
                saved_caption = user.get('photo', '')
                user['model'] = model_key
                set_model(conn, tid, model_key)
                model_info = MODELS[model_key]
                if saved_caption and mg:
                    tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Генерирую через {model_info["name"]}...'})
                    tg('editMessageText', {
                        'chat_id': chat_id,
                        'message_id': msg_id,
                        'text': f'🎨 Генерирую через {model_info["name"]}...\nОбычно 15-60 секунд.',
                        'parse_mode': 'HTML'
                    })
                    cdn_urls = get_album_photos(conn, tid, mg)
                    if len(cdn_urls) < 2:
                        send_msg(chat_id, '❌ Фото не найдены. Отправьте альбом заново.')
                        set_session(conn, tid, None)
                    else:
                        do_generate(conn, chat_id, tid, user, saved_caption, photo_cdn_urls=cdn_urls)
                else:
                    set_session_album(conn, tid, 'waiting_album_prompt', mg)
                    tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Выбрана: {model_info["name"]}'})
                    tg('editMessageText', {
                        'chat_id': chat_id,
                        'message_id': msg_id,
                        'text': f'✅ Модель: <b>{model_info["name"]}</b>\n\n✍️ Напишите, что сделать с этими фотографиями.\n\n<i>Например: Объедини в коллаж, Совмести лица, Сделай одну картинку из двух</i>',
                        'parse_mode': 'HTML',
                        'reply_markup': {'inline_keyboard': [[{'text': '🏠 Отмена', 'callback_data': 'go_start'}]]}
                    })
            elif state == 'caption_choose_model' and saved_prompt:
                saved_caption = user.get('media_group', '') or ''
                if saved_caption:
                    user['model'] = model_key
                    model_info = MODELS[model_key]
                    tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Генерирую через {model_info["name"]}...'})
                    tg('editMessageText', {
                        'chat_id': chat_id,
                        'message_id': msg_id,
                        'text': f'🎨 Генерирую через {model_info["name"]}...\nОбычно 15-60 секунд.',
                        'parse_mode': 'HTML'
                    })
                    photo_bytes = download_url(saved_prompt)
                    if photo_bytes:
                        do_generate(conn, chat_id, tid, user, saved_caption, photo_bytes)
                    else:
                        send_msg(chat_id, '❌ Фото устарело. Отправьте его ещё раз.')
                        set_session(conn, tid, None)
                else:
                    set_session(conn, tid, 'chosen_img_model', saved_prompt)
                    model_info = MODELS[model_key]
                    tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Выбрана: {model_info["name"]}'})
                    tg('editMessageText', {
                        'chat_id': chat_id,
                        'message_id': msg_id,
                        'text': f'✅ Модель: <b>{model_info["name"]}</b>\n\nТеперь напишите, что изменить на фото.\n\n<i>Например: Сделай фон осенним, Add sunglasses</i>',
                        'parse_mode': 'HTML',
                        'reply_markup': {'inline_keyboard': [[{'text': '🏠 Отмена', 'callback_data': 'go_start'}]]}
                    })
            elif state == 'choosing_text_model' and saved_prompt:
                user['model'] = model_key
                model_info = MODELS[model_key]
                tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Генерирую через {model_info["name"]}...'})
                tg('editMessageText', {
                    'chat_id': chat_id,
                    'message_id': msg_id,
                    'text': f'🎨 Генерирую через {model_info["name"]}...\nОбычно 15-60 секунд.',
                    'parse_mode': 'HTML'
                })
                do_generate(conn, chat_id, tid, user, saved_prompt)
            elif state == 'waiting_prompt' and saved_prompt:
                set_session(conn, tid, 'chosen_img_model', saved_prompt)
                set_model(conn, tid, model_key)
                model_info = MODELS[model_key]
                tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Выбрана: {model_info["name"]}'})
                tg('editMessageText', {
                    'chat_id': chat_id,
                    'message_id': msg_id,
                    'text': f'✅ Модель: <b>{model_info["name"]}</b>\n\nТеперь напишите, что изменить на фото.\n\n<i>Например: Сделай фон осенним, Add sunglasses</i>',
                    'parse_mode': 'HTML',
                    'reply_markup': {'inline_keyboard': [[{'text': '🏠 Отмена', 'callback_data': 'go_start'}]]}
                })
            else:
                model_info = MODELS[model_key]
                tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Выбрана: {model_info["name"]}'})
                tg('editMessageText', {
                    'chat_id': chat_id,
                    'message_id': msg_id,
                    'text': f'✅ Модель: {model_info["name"]}\n<i>{model_info["desc"]}</i>\n\nОтправьте фото или текст для генерации!',
                    'parse_mode': 'HTML',
                    'reply_markup': {'inline_keyboard': [[{'text': '🏠 Главное меню', 'callback_data': 'go_start'}]]}
                })
        finally:
            conn.close()
        return ok()

    if cb_data == 'after_edit':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        conn = get_db()
        try:
            uname = callback['from'].get('username', '')
            fname = callback['from'].get('first_name', 'User')
            user = get_user(conn, tid, uname, fname)
            photo_url = user.get('photo')
            if photo_url and user.get('state') == 'after_gen':
                set_session(conn, tid, 'waiting_prompt', photo_url)
                send_msg(chat_id,
                    '✏️ <b>Редактирование</b>\n\n'
                    'Напишите, что изменить на этой картинке.\n\n'
                    '<i>Например: Добавь закат на фоне, Сделай ярче, Убери фон</i>',
                    reply_markup={'inline_keyboard': [
                        [{'text': '🏠 Отмена', 'callback_data': 'go_start'}]
                    ]}
                )
            else:
                send_msg(chat_id,
                    '📸 Отправьте фото, которое хотите отредактировать.',
                    reply_markup={'inline_keyboard': [
                        [{'text': '🏠 На главную', 'callback_data': 'go_start'}]
                    ]}
                )
        finally:
            conn.close()
        return ok()

    if cb_data == 'after_redesign':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        conn = get_db()
        try:
            uname = callback['from'].get('username', '')
            fname = callback['from'].get('first_name', 'User')
            user = get_user(conn, tid, uname, fname)
            photo_url = user.get('photo')
            if photo_url and user.get('state') == 'after_gen':
                set_session(conn, tid, 'waiting_prompt', photo_url)
                send_msg(chat_id,
                    '🎨 <b>Сменить дизайн</b>\n\n'
                    'Опишите новый стиль для этой картинки.\n\n'
                    '<i>Например: В стиле аниме, Как масляная картина, В стиле киберпанк, Акварель</i>',
                    reply_markup={'inline_keyboard': [
                        [{'text': '🏠 Отмена', 'callback_data': 'go_start'}]
                    ]}
                )
            else:
                send_msg(chat_id,
                    '📸 Отправьте фото для смены дизайна.',
                    reply_markup={'inline_keyboard': [
                        [{'text': '🏠 На главную', 'callback_data': 'go_start'}]
                    ]}
                )
        finally:
            conn.close()
        return ok()

    if cb_data.startswith('switch_multi:'):
        model_key = cb_data.split(':', 1)[1]
        if model_key not in MODELS:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Неизвестная модель'})
            return ok()

        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        conn = get_db()
        try:
            set_model(conn, tid, model_key)
            mg = get_user_media_group(conn, tid)
            if mg:
                set_session_album(conn, tid, 'waiting_album_prompt', mg)
            model_info = MODELS[model_key]
            tg('editMessageText', {
                'chat_id': chat_id,
                'message_id': msg_id,
                'text': (
                    f'✅ Модель переключена на <b>{model_info["name"]}</b>\n\n'
                    f'✍️ Теперь напишите, что сделать с фотографиями.\n\n'
                    f'<i>Например: Объедини в одну картинку, Совмести эти фото, Сделай коллаж</i>'
                ),
                'parse_mode': 'HTML',
                'reply_markup': {'inline_keyboard': [
                    [{'text': '🏠 Отмена', 'callback_data': 'go_start'}]
                ]}
            })
        finally:
            conn.close()
        return ok()

    return ok()