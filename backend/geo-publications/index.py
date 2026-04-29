"""
Business: CRUD публикаций (URL опубликованных материалов) и проверка попадания в LLM-ответы.
Args: event с httpMethod (GET/POST/PUT/DELETE), action=check, headers (X-Auth-Token), body, queryStringParameters
Returns: HTTP-ответ со списком публикаций, операцией или результатом проверки индексации
"""
import json
import os
import hmac
import hashlib
import base64
import time
import urllib.parse
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
YANDEX_GPT_BASE = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
PROVIDERS = {
    'openai_gpt4o': 'openai/gpt-4o-mini',
    'openai_gpt4': 'openai/gpt-4o',
    'yandex_gpt': 'yandexgpt/latest',
}


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


def extract_domain(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).hostname or ''
        return host.replace('www.', '').lower()
    except Exception:
        return ''


def call_yandex_gpt(query: str, timeout: int = 60):
    api_key = os.environ.get('YANDEX_GPT_API_KEY', '')
    folder_id = os.environ.get('YANDEX_GPT_FOLDER_ID', '')
    if not api_key or not folder_id:
        raise RuntimeError('YANDEX_GPT_API_KEY or YANDEX_GPT_FOLDER_ID missing')
    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt/latest',
        'completionOptions': {'stream': False, 'temperature': 0.3, 'maxTokens': 1500},
        'messages': [
            {'role': 'system', 'text': 'Ответь на вопрос с указанием конкретных источников, брендов и ссылок.'},
            {'role': 'user', 'text': query},
        ],
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        YANDEX_GPT_BASE, data=data, method='POST',
        headers={'Authorization': f'Api-Key {api_key}', 'Content-Type': 'application/json', 'x-folder-id': folder_id},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'YandexGPT HTTP {e.code}: {err_body[:300]}')
    alts = (body.get('result') or {}).get('alternatives') or []
    text = (alts[0].get('message') or {}).get('text', '') if alts else ''
    return {'text': text, 'citations': []}


def call_vsegpt(provider: str, query: str, timeout: int = 60):
    if provider == 'yandex_gpt':
        return call_yandex_gpt(query, timeout)
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    payload = {
        'model': PROVIDERS[provider],
        'messages': [
            {'role': 'system', 'content': 'Ответь на вопрос с указанием конкретных источников и ссылок.'},
            {'role': 'user', 'content': query},
        ],
        'temperature': 0.3,
        'max_tokens': 1500,
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
    choice = body['choices'][0]['message']
    return {
        'text': choice.get('content', '') or '',
        'citations': body.get('citations') or choice.get('citations') or [],
    }


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
        if qs.get('id') and action == 'checks':
            return list_checks(tenant_id, qs['id'])
        return list_publications(tenant_id)
    if method == 'POST':
        if action == 'check':
            return check_publication(tenant_id, qs.get('id', ''))
        return create_publication(tenant_id, body)
    if method == 'PUT':
        return update_publication(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_publication(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def list_publications(tenant_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id, p.title, p.url, p.extra_urls, p.platform, p.status, p.published_at,
                       p.last_check_at, p.last_check_found, p.notes,
                       p.draft_id, p.query_id, q.text AS query_text,
                       p.created_at, p.updated_at
                FROM geo_publications_v2 p
                LEFT JOIN geo_tracked_queries q ON q.id = p.query_id AND q.tenant_id = p.tenant_id
                WHERE p.tenant_id = %s
                ORDER BY p.created_at DESC
                """,
                (tenant_id,)
            )
            rows = cur.fetchall()

            cur.execute(
                """
                SELECT DISTINCT ON (publication_id, provider)
                       publication_id, provider, found, checked_at
                FROM geo_publication_checks_v2
                WHERE tenant_id = %s
                ORDER BY publication_id, provider, checked_at DESC
                """,
                (tenant_id,)
            )
            latest = cur.fetchall()
        per_pub = {}
        for c in latest:
            pid = str(c['publication_id'])
            per_pub.setdefault(pid, {})[c['provider']] = {
                'found': bool(c['found']),
                'checked_at': c['checked_at'].isoformat() if c['checked_at'] else None,
            }
        return resp(200, {'publications': [
            {**serialize(r), 'providers': per_pub.get(str(r['id']), {})} for r in rows
        ]})
    finally:
        conn.close()


def serialize(r):
    extra = r.get('extra_urls') or []
    if isinstance(extra, str):
        try:
            extra = json.loads(extra)
        except Exception:
            extra = []
    urls = [r['url']] + [u for u in extra if u]
    return {
        'id': str(r['id']), 'title': r['title'], 'url': r['url'],
        'urls': urls,
        'extra_urls': extra,
        'platform': r['platform'], 'status': r['status'],
        'published_at': r['published_at'].isoformat() if r['published_at'] else None,
        'last_check_at': r['last_check_at'].isoformat() if r['last_check_at'] else None,
        'last_check_found': r['last_check_found'],
        'notes': r['notes'],
        'draft_id': str(r['draft_id']) if r['draft_id'] else None,
        'query_id': str(r['query_id']) if r['query_id'] else None,
        'query_text': r.get('query_text'),
        'created_at': r['created_at'].isoformat(),
        'updated_at': r['updated_at'].isoformat(),
    }


def normalize_urls(body: dict):
    raw = body.get('urls')
    out = []
    if isinstance(raw, list):
        for u in raw:
            if isinstance(u, str) and u.strip():
                out.append(u.strip())
    single = (body.get('url') or '').strip()
    if single and single not in out:
        out.insert(0, single)
    seen, dedup = set(), []
    for u in out:
        if u not in seen and (u.startswith('http://') or u.startswith('https://')):
            seen.add(u)
            dedup.append(u)
    return dedup


def create_publication(tenant_id: str, body: dict):
    title = (body.get('title') or '').strip()
    urls = normalize_urls(body)
    if not title or not urls:
        return resp(400, {'error': 'title_and_url_required'})

    url = urls[0]
    extra_urls = urls[1:]
    platform = (body.get('platform') or extract_domain(url) or '').strip() or None
    draft_id = body.get('draft_id') or None
    query_id = body.get('query_id') or None
    published_at = body.get('published_at')
    notes = body.get('notes')
    status = body.get('status') or 'live'

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO geo_publications_v2
                      (tenant_id, draft_id, query_id, title, url, extra_urls, platform, published_at, status, notes)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s)
                    RETURNING id, created_at, updated_at, last_check_at, last_check_found, published_at
                    """,
                    (tenant_id, draft_id, query_id, title, url, json.dumps(extra_urls),
                     platform, published_at, status, notes)
                )
                row = cur.fetchone()
                if draft_id:
                    cur.execute(
                        "UPDATE geo_drafts SET status = 'published', updated_at = NOW() "
                        "WHERE tenant_id = %s AND id = %s",
                        (tenant_id, draft_id)
                    )
        return resp(200, {'publication': {
            'id': str(row['id']), 'title': title, 'url': url, 'urls': urls,
            'extra_urls': extra_urls,
            'platform': platform,
            'status': status, 'notes': notes,
            'draft_id': draft_id, 'query_id': query_id,
            'published_at': row['published_at'].isoformat() if row['published_at'] else None,
            'last_check_at': None, 'last_check_found': None,
            'created_at': row['created_at'].isoformat(),
            'updated_at': row['updated_at'].isoformat(),
        }})
    finally:
        conn.close()


def update_publication(tenant_id: str, pub_id: str, body: dict):
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []

    if 'urls' in body or ('url' in body and isinstance(body.get('urls'), list) is False):
        urls = normalize_urls(body)
        if urls:
            fields.append('url = %s'); values.append(urls[0])
            fields.append('extra_urls = %s::jsonb'); values.append(json.dumps(urls[1:]))
    for f in ('title', 'platform', 'status', 'notes'):
        if f in body:
            fields.append(f'{f} = %s'); values.append(body[f])
    if 'published_at' in body:
        fields.append('published_at = %s'); values.append(body['published_at'])
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, pub_id])
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_publications_v2 SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_publication(tenant_id: str, pub_id: str):
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM geo_publication_checks_v2 WHERE tenant_id = %s AND publication_id = %s',
                            (tenant_id, pub_id))
                cur.execute('DELETE FROM geo_publications_v2 WHERE tenant_id = %s AND id = %s',
                            (tenant_id, pub_id))
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def list_checks(tenant_id: str, pub_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, provider, found, snippet, checked_at
                FROM geo_publication_checks_v2
                WHERE tenant_id = %s AND publication_id = %s
                ORDER BY checked_at DESC
                LIMIT 30
                """,
                (tenant_id, pub_id)
            )
            rows = cur.fetchall()
        return resp(200, {'checks': [{
            'id': str(r['id']), 'provider': r['provider'], 'found': r['found'],
            'snippet': r['snippet'], 'checked_at': r['checked_at'].isoformat(),
        } for r in rows]})
    finally:
        conn.close()


def check_publication(tenant_id: str, pub_id: str):
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.url, p.extra_urls, p.title, p.query_id, q.text AS query_text
                FROM geo_publications_v2 p
                LEFT JOIN geo_tracked_queries q ON q.id = p.query_id AND q.tenant_id = p.tenant_id
                WHERE p.tenant_id = %s AND p.id = %s
                """,
                (tenant_id, pub_id)
            )
            pub = cur.fetchone()
        if not pub:
            return resp(404, {'error': 'not_found'})

        extra = pub.get('extra_urls') or []
        if isinstance(extra, str):
            try:
                extra = json.loads(extra)
            except Exception:
                extra = []
        all_urls = [pub['url']] + [u for u in extra if u]
        url_pairs = [(u.lower(), extract_domain(u)) for u in all_urls]
        title_words = (pub['title'] or '').lower()
        query_text = pub['query_text'] or pub['title'] or ''
        if not query_text:
            return resp(400, {'error': 'no_query_to_check'})

        results = []
        any_found = False
        for provider in PROVIDERS.keys():
            try:
                r = call_vsegpt(provider, query_text)
            except Exception as e:
                print(f'[pub-check] {provider}: {e}')
                results.append({'provider': provider, 'found': False, 'error': str(e)})
                continue

            text_lc = (r['text'] or '').lower()
            citations = r.get('citations') or []
            found_in_citations = False
            found_in_text = False
            matched_domain = ''
            for url_lc, dom in url_pairs:
                if dom and any(dom in str(c).lower() for c in citations):
                    found_in_citations = True; matched_domain = dom; break
                if (dom and dom in text_lc) or url_lc in text_lc:
                    found_in_text = True; matched_domain = dom; break
            found_by_title = title_words and title_words in text_lc and len(title_words) > 15
            found = bool(found_in_citations or found_in_text or found_by_title)

            snippet = ''
            if matched_domain:
                idx = text_lc.find(matched_domain)
                if idx >= 0:
                    snippet = r['text'][max(0, idx - 100):idx + 200]
            if not snippet and citations:
                snippet = ' | '.join(str(c) for c in citations[:3])[:500]

            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'INSERT INTO geo_publication_checks_v2 '
                        '(tenant_id, publication_id, provider, found, snippet, raw_response) '
                        'VALUES (%s, %s, %s, %s, %s, %s)',
                        (tenant_id, pub_id, provider, found, snippet[:1024], r['text'][:5000])
                    )

            results.append({
                'provider': provider, 'found': found,
                'snippet': snippet[:500],
                'citations': citations[:5],
            })
            if found:
                any_found = True

        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE geo_publications_v2 SET last_check_at = NOW(), last_check_found = %s, updated_at = NOW() '
                    'WHERE tenant_id = %s AND id = %s',
                    (any_found, tenant_id, pub_id)
                )

        return resp(200, {'found': any_found, 'results': results})
    finally:
        conn.close()