"""API для управления базой знаний бота: добавление URL, файлов и текста"""
import json
import os
import base64
import re
import urllib.request
import urllib.error
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def extract_text_from_url(url):
    """Извлекает текст с веб-страницы"""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return None, str(e)

    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<[^>]+>', ' ', html)
    html = re.sub(r'\s+', ' ', html).strip()

    title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else url

    text = html[:50000]
    return {'title': title, 'text': text}, None


def extract_text_from_file(file_data_b64, file_type):
    """Извлекает текст из файла (base64)"""
    try:
        data = base64.b64decode(file_data_b64)
    except Exception as e:
        return None, f'Ошибка декодирования файла: {e}'

    if file_type in ('txt', 'text/plain'):
        text = data.decode('utf-8', errors='ignore')
        return {'text': text[:50000]}, None

    if file_type in ('csv', 'text/csv'):
        text = data.decode('utf-8', errors='ignore')
        return {'text': text[:50000]}, None

    if file_type in ('pdf', 'application/pdf'):
        text_parts = []
        raw = data.decode('latin-1')
        streams = re.findall(r'stream\s(.*?)endstream', raw, re.DOTALL)
        for stream in streams:
            clean = re.sub(r'[^\x20-\x7E\xC0-\xFF]', ' ', stream)
            text_parts.append(clean)
        text = ' '.join(text_parts)
        text = re.sub(r'\s+', ' ', text).strip()
        if len(text) < 50:
            return {'text': f'[PDF документ, {len(data)} байт — текст не удалось извлечь полностью. Загрузите TXT версию для лучшего результата.]'}, None
        return {'text': text[:50000]}, None

    if file_type in ('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
        import zipfile
        import io
        try:
            z = zipfile.ZipFile(io.BytesIO(data))
            xml = z.read('word/document.xml').decode('utf-8', errors='ignore')
            text = re.sub(r'<[^>]+>', ' ', xml)
            text = re.sub(r'\s+', ' ', text).strip()
            return {'text': text[:50000]}, None
        except Exception as e:
            return None, f'Ошибка чтения DOCX: {e}'

    return None, f'Неподдерживаемый формат: {file_type}'


def upload_to_s3(file_data_b64, filename):
    """Загружает файл в S3 и возвращает CDN URL"""
    import boto3
    data = base64.b64decode(file_data_b64)
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    key = f'knowledge/{filename}'
    content_type = 'application/octet-stream'
    if filename.endswith('.pdf'):
        content_type = 'application/pdf'
    elif filename.endswith('.txt'):
        content_type = 'text/plain'
    elif filename.endswith('.docx'):
        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url


def handler(event, context):
    """Управление базой знаний бота — добавление URL, файлов и текста"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    conn = get_db()
    cur = conn.cursor()

    try:
        if method == 'GET':
            bot_id = params.get('bot_id')
            if not bot_id:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'bot_id обязателен'})}

            cur.execute(
                f"SELECT id, bot_id, source_type, title, url, file_url, file_type, status, error_message, created_at "
                f"FROM {SCHEMA}.knowledge_sources WHERE bot_id = %s ORDER BY created_at DESC",
                (int(bot_id),)
            )
            rows = cur.fetchall()
            sources = []
            for r in rows:
                sources.append({
                    'id': r[0], 'bot_id': r[1], 'source_type': r[2], 'title': r[3],
                    'url': r[4], 'file_url': r[5], 'file_type': r[6],
                    'status': r[7], 'error_message': r[8],
                    'created_at': r[9].isoformat() if r[9] else None
                })
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'sources': sources})}

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'add')
            bot_id = body.get('bot_id')

            if not bot_id:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'bot_id обязателен'})}

            if action == 'add_url':
                url = body.get('url', '').strip()
                if not url or not url.startswith('http'):
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректный URL'})}

                result, err = extract_text_from_url(url)
                if err:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.knowledge_sources (bot_id, source_type, title, url, status, error_message) "
                        f"VALUES (%s, 'url', %s, %s, 'error', %s) RETURNING id",
                        (int(bot_id), url, url, err)
                    )
                    src_id = cur.fetchone()[0]
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                        'id': src_id, 'status': 'error', 'error': err
                    })}

                cur.execute(
                    f"INSERT INTO {SCHEMA}.knowledge_sources (bot_id, source_type, title, url, content, status) "
                    f"VALUES (%s, 'url', %s, %s, %s, 'ready') RETURNING id",
                    (int(bot_id), result['title'][:500], url, result['text'])
                )
                src_id = cur.fetchone()[0]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                    'id': src_id, 'status': 'ready', 'title': result['title'][:500],
                    'text_length': len(result['text'])
                })}

            elif action == 'add_file':
                file_data = body.get('file_data')
                file_name = body.get('file_name', 'document')
                file_type = body.get('file_type', 'txt')

                if not file_data:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Файл не передан'})}

                file_url = upload_to_s3(file_data, f"{bot_id}_{file_name}")

                ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else file_type
                result, err = extract_text_from_file(file_data, ext)

                if err:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.knowledge_sources (bot_id, source_type, title, file_url, file_type, status, error_message) "
                        f"VALUES (%s, 'file', %s, %s, %s, 'error', %s) RETURNING id",
                        (int(bot_id), file_name, file_url, ext, err)
                    )
                    src_id = cur.fetchone()[0]
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                        'id': src_id, 'status': 'error', 'error': err
                    })}

                cur.execute(
                    f"INSERT INTO {SCHEMA}.knowledge_sources (bot_id, source_type, title, file_url, file_type, content, status) "
                    f"VALUES (%s, 'file', %s, %s, %s, %s, 'ready') RETURNING id",
                    (int(bot_id), file_name, file_url, ext, result['text'])
                )
                src_id = cur.fetchone()[0]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                    'id': src_id, 'status': 'ready', 'title': file_name,
                    'text_length': len(result['text']), 'file_url': file_url
                })}

            elif action == 'add_text':
                text = body.get('text', '').strip()
                title = body.get('title', 'Текстовая запись')

                if not text:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Текст не передан'})}

                cur.execute(
                    f"INSERT INTO {SCHEMA}.knowledge_sources (bot_id, source_type, title, content, status) "
                    f"VALUES (%s, 'text', %s, %s, 'ready') RETURNING id",
                    (int(bot_id), title[:500], text[:50000])
                )
                src_id = cur.fetchone()[0]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                    'id': src_id, 'status': 'ready', 'title': title[:500],
                    'text_length': len(text)
                })}

            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Неизвестное действие: {action}'})}

        if method == 'DELETE':
            source_id = params.get('id')
            if not source_id:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'id обязателен'})}
            cur.execute(f"UPDATE {SCHEMA}.knowledge_sources SET status = 'error', error_message = 'Удалено пользователем' WHERE id = %s", (int(source_id),))
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддержан'})}

    finally:
        cur.close()
        conn.close()
