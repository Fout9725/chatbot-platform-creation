"""
Business: Генерация и управление черновиками статей под GEO-запросы (через VseGPT).
Args: event с httpMethod (GET/POST/PUT/DELETE), headers (X-Auth-Token), body, queryStringParameters
Returns: HTTP-ответ со списком черновиков, одним черновиком или результатом операции
"""
import json
import os
import re
import hmac
import hashlib
import base64
import time
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
DEFAULT_MODEL = 'openai/gpt-4o-mini'


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def resp(status, body):
    return {'statusCode': status, 'headers': cors_headers(), 'isBase64Encoded': False,
            'body': json.dumps(body, ensure_ascii=False, default=str)}


def b64url_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def jwt_decode(token: str, secret: str):
    try:
        h, p, s = token.split('.')
        sig_input = f'{h}.{p}'.encode()
        expected = hmac.new(secret.encode(), sig_input, hashlib.sha256).digest()
        if not hmac.compare_digest(b64url(expected), s):
            return None
        payload = json.loads(b64url_decode(p))
        if payload.get('exp', 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def get_tenant(headers: dict):
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    payload = jwt_decode(token, os.environ.get('GEO_JWT_SECRET', 'dev-secret'))
    return payload.get('tid') if payload else None


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def call_llm(prompt: str, system: str, model: str = DEFAULT_MODEL, timeout: int = 90):
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.6,
        'max_tokens': 3000,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        VSEGPT_BASE, data=data, method='POST',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'VseGPT HTTP {e.code}: {err_body[:300]}')
    return body['choices'][0]['message'].get('content', '') or ''


def word_count(text: str) -> int:
    return len(re.findall(r'\w+', text or ''))


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}

    headers = event.get('headers') or {}
    tenant_id = get_tenant(headers)
    if not tenant_id:
        return resp(401, {'error': 'unauthorized'})

    qs = event.get('queryStringParameters') or {}
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}

    action = qs.get('action')

    if method == 'GET':
        if qs.get('id'):
            return get_draft(tenant_id, qs['id'])
        return list_drafts(tenant_id)
    if method == 'POST':
        if action == 'generate':
            return generate_draft(tenant_id, body)
        return create_draft(tenant_id, body)
    if method == 'PUT':
        return update_draft(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_draft(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def list_drafts(tenant_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT d.id, d.title, d.status, d.word_count, d.target_keywords,
                       d.model, d.created_at, d.updated_at,
                       d.query_id, q.text AS query_text
                FROM geo_drafts d
                LEFT JOIN geo_tracked_queries q ON q.id = d.query_id AND q.tenant_id = d.tenant_id
                WHERE d.tenant_id = %s
                ORDER BY d.updated_at DESC
                """,
                (tenant_id,)
            )
            rows = cur.fetchall()
        return resp(200, {'drafts': [{
            'id': str(r['id']), 'title': r['title'], 'status': r['status'],
            'word_count': r['word_count'], 'target_keywords': r['target_keywords'] or [],
            'model': r['model'], 'query_id': str(r['query_id']) if r['query_id'] else None,
            'query_text': r['query_text'],
            'created_at': r['created_at'].isoformat(),
            'updated_at': r['updated_at'].isoformat(),
        } for r in rows]})
    finally:
        conn.close()


def get_draft(tenant_id: str, draft_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT d.*, q.text AS query_text
                FROM geo_drafts d
                LEFT JOIN geo_tracked_queries q ON q.id = d.query_id AND q.tenant_id = d.tenant_id
                WHERE d.tenant_id = %s AND d.id = %s
                """,
                (tenant_id, draft_id)
            )
            r = cur.fetchone()
        if not r:
            return resp(404, {'error': 'not_found'})
        return resp(200, {'draft': {
            'id': str(r['id']), 'title': r['title'], 'content_md': r['content_md'],
            'status': r['status'], 'word_count': r['word_count'],
            'target_keywords': r['target_keywords'] or [], 'model': r['model'],
            'query_id': str(r['query_id']) if r['query_id'] else None,
            'query_text': r['query_text'],
            'created_at': r['created_at'].isoformat(),
            'updated_at': r['updated_at'].isoformat(),
        }})
    finally:
        conn.close()


def create_draft(tenant_id: str, body: dict):
    title = (body.get('title') or '').strip() or 'Без названия'
    content = body.get('content_md') or ''
    keywords = body.get('target_keywords') or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(',') if k.strip()]
    query_id = body.get('query_id')

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'INSERT INTO geo_drafts (tenant_id, query_id, title, content_md, target_keywords, word_count) '
                    'VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at, updated_at',
                    (tenant_id, query_id, title, content, keywords, word_count(content))
                )
                row = cur.fetchone()
        return resp(200, {'draft': {
            'id': str(row['id']), 'title': title, 'content_md': content,
            'target_keywords': keywords, 'status': 'draft', 'word_count': word_count(content),
            'query_id': query_id,
            'created_at': row['created_at'].isoformat(),
            'updated_at': row['updated_at'].isoformat(),
        }})
    finally:
        conn.close()


def update_draft(tenant_id: str, draft_id: str, body: dict):
    if not draft_id:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []
    if 'title' in body:
        fields.append('title = %s'); values.append(str(body['title']).strip() or 'Без названия')
    if 'content_md' in body:
        c = body['content_md'] or ''
        fields.append('content_md = %s'); values.append(c)
        fields.append('word_count = %s'); values.append(word_count(c))
    if 'status' in body:
        if body['status'] not in ('draft', 'ready', 'published', 'archived'):
            return resp(400, {'error': 'bad_status'})
        fields.append('status = %s'); values.append(body['status'])
    if 'target_keywords' in body:
        kw = body['target_keywords']
        if isinstance(kw, str):
            kw = [k.strip() for k in kw.split(',') if k.strip()]
        fields.append('target_keywords = %s'); values.append(kw)
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, draft_id])
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_drafts SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_draft(tenant_id: str, draft_id: str):
    if not draft_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM geo_drafts WHERE tenant_id = %s AND id = %s',
                    (tenant_id, draft_id)
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def generate_draft(tenant_id: str, body: dict):
    query_id = body.get('query_id')
    custom_topic = (body.get('topic') or '').strip()
    tone = body.get('tone') or 'expert'
    length = body.get('length') or 'medium'
    model = body.get('model') or DEFAULT_MODEL

    conn = get_db()
    try:
        query_text = custom_topic
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if query_id:
                cur.execute(
                    'SELECT text FROM geo_tracked_queries WHERE tenant_id = %s AND id = %s',
                    (tenant_id, query_id)
                )
                row = cur.fetchone()
                if row:
                    query_text = row['text']
            if not query_text:
                return resp(400, {'error': 'topic_or_query_required'})

            cur.execute(
                'SELECT name, aliases, is_own FROM geo_brands WHERE tenant_id = %s',
                (tenant_id,)
            )
            brands = cur.fetchall()

        own_brand = next((b for b in brands if b['is_own']), None)
        own_name = own_brand['name'] if own_brand else 'наш бренд'
        competitor_names = [b['name'] for b in brands if not b['is_own']][:5]
        keywords = [own_name] + competitor_names

        length_map = {
            'short': 'около 400 слов, 3 раздела',
            'medium': '700-900 слов, 5-6 разделов',
            'long': '1200-1500 слов, 7-8 разделов',
        }
        tone_map = {
            'expert': 'экспертный, аналитический, со ссылками на данные',
            'friendly': 'дружелюбный, доступный, разговорный',
            'sales': 'убедительный, продающий, с акцентом на выгоды',
        }
        sys = (
            'Ты — опытный контент-маркетолог. Пишешь статьи в Markdown, оптимизированные '
            'под поиск нейросетями (GEO/AEO): чёткая структура, факты, списки, таблицы. '
            'Используй H2 (##) и H3 (###), bullet-listы. Никакой воды.'
        )
        prompt = f"""Напиши статью на русском языке по теме: «{query_text}»

Требования:
- Объём: {length_map.get(length, length_map['medium'])}
- Тон: {tone_map.get(tone, tone_map['expert'])}
- Обязательно органично упомяни бренд «{own_name}» в положительном контексте 2-3 раза
- Сравни с конкурентами: {', '.join(competitor_names) if competitor_names else 'упомяни другие решения на рынке'}
- Структура: вводный абзац, ## разделы, маркированные списки, итоговый вывод
- В конце добавь раздел «## Часто задаваемые вопросы» с 3-4 Q&A
- Заголовок статьи начни с # и сделай его SEO-оптимизированным

Верни только Markdown, без преамбулы."""

        text = call_llm(prompt, sys, model)

        m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
        title = m.group(1).strip() if m else query_text[:120]

        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'INSERT INTO geo_drafts '
                    '(tenant_id, query_id, title, content_md, target_keywords, model, word_count) '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at, updated_at',
                    (tenant_id, query_id, title, text, keywords, model, word_count(text))
                )
                row = cur.fetchone()

        return resp(200, {'draft': {
            'id': str(row['id']), 'title': title, 'content_md': text,
            'target_keywords': keywords, 'status': 'draft', 'model': model,
            'word_count': word_count(text),
            'query_id': query_id, 'query_text': query_text,
            'created_at': row['created_at'].isoformat(),
            'updated_at': row['updated_at'].isoformat(),
        }})
    finally:
        conn.close()