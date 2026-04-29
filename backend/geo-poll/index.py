"""
Business: Опрос LLM (GPT-Search и Perplexity через VseGPT) по запросам tenant.
Сохраняет ответы, парсит упоминания брендов и тональность.
Args: event с httpMethod=POST, body {query_id?: str} — конкретный запрос или все активные
Returns: {polled: int, responses: int, mentions: int}
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

PROVIDERS = {
    'openai_search': 'openai/gpt-4o-search-preview',
    'perplexity': 'perplexity/sonar',
}

POSITIVE = {'лучший', 'рекоменд', 'надёжн', 'качествен', 'удобн', 'выгодн',
            'best', 'recommended', 'great', 'excellent', 'top'}
NEGATIVE = {'плохой', 'не рекоменд', 'слабый', 'проблем', 'дорог', 'устарел',
            'bad', 'poor', 'issue', 'avoid', 'worst'}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Cron-Key',
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


def call_vsegpt(provider: str, query: str, language: str = 'ru', timeout: int = 60):
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    if provider not in PROVIDERS:
        raise ValueError(f'unknown provider: {provider}')

    sys_prompt = (
        'Ты — поисковый ассистент. Дай развёрнутый, фактический ответ на запрос. '
        'Указывай конкретные названия брендов, цифры, годы и ссылки на источники.'
        if language == 'ru' else
        'You are a search assistant. Provide a detailed factual answer with specific brand names, numbers, and sources.'
    )

    payload = {
        'model': PROVIDERS[provider],
        'messages': [
            {'role': 'system', 'content': sys_prompt},
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
        'model': body.get('model', PROVIDERS[provider]),
        'usage': body.get('usage', {}),
    }


def find_mentions(text: str, brands):
    """brands: list of dict {id, name, aliases}"""
    text_lower = text.lower()
    found = []
    for b in brands:
        names = [b['name']] + (b.get('aliases') or [])
        for name in names:
            n = name.strip().lower()
            if not n:
                continue
            try:
                m = re.search(rf'\b{re.escape(n)}\b', text_lower)
            except re.error:
                continue
            if not m:
                continue
            start = max(0, m.start() - 120)
            end = min(len(text), m.end() + 120)
            snippet = text[start:end].strip()
            snip_lc = snippet.lower()
            pos = sum(1 for w in POSITIVE if w in snip_lc)
            neg = sum(1 for w in NEGATIVE if w in snip_lc)
            score = (pos - neg) / max(1, pos + neg)
            if score > 0.2:
                sentiment = 'positive'
            elif score < -0.2:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            found.append({
                'brand_id': b['id'],
                'sentiment': sentiment,
                'score': float(score),
                'position': m.start(),
                'snippet': snippet[:1024],
            })
            break
    return found


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}
    if method != 'POST':
        return resp(405, {'error': 'method_not_allowed'})

    headers = event.get('headers') or {}
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}

    tenant_id = get_tenant(headers)
    if not tenant_id:
        return resp(401, {'error': 'unauthorized'})

    query_id = body.get('query_id')
    return poll_for_tenant(tenant_id, query_id)


def poll_for_tenant(tenant_id: str, query_id):
    conn = get_db()
    polled, total_resp, total_ment = 0, 0, 0
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if query_id:
                cur.execute(
                    'SELECT id, text, language FROM geo_tracked_queries '
                    'WHERE tenant_id = %s AND id = %s AND is_active = TRUE',
                    (tenant_id, query_id)
                )
            else:
                cur.execute(
                    'SELECT id, text, language FROM geo_tracked_queries '
                    'WHERE tenant_id = %s AND is_active = TRUE',
                    (tenant_id,)
                )
            queries = cur.fetchall()

            cur.execute(
                'SELECT id, name, aliases, is_own FROM geo_brands WHERE tenant_id = %s',
                (tenant_id,)
            )
            brands = [{
                'id': str(r['id']), 'name': r['name'],
                'aliases': r['aliases'] or [], 'is_own': r['is_own'],
            } for r in cur.fetchall()]

        if not queries:
            return resp(200, {'polled': 0, 'responses': 0, 'mentions': 0, 'note': 'no_active_queries'})

        for q in queries:
            qid = str(q['id'])
            for provider in PROVIDERS.keys():
                try:
                    res = call_vsegpt(provider, q['text'], q['language'])
                except Exception as e:
                    print(f'[poll] {provider} {qid}: {e}')
                    continue

                with conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(
                            'INSERT INTO geo_llm_responses '
                            '(tenant_id, query_id, provider, model, raw_text, citations, meta) '
                            'VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb) RETURNING id',
                            (tenant_id, qid, provider, res['model'], res['text'],
                             json.dumps(res['citations']), json.dumps({'usage': res['usage']}))
                        )
                        rid = str(cur.fetchone()['id'])
                        total_resp += 1

                        mentions = find_mentions(res['text'], brands)
                        for m in mentions:
                            cur.execute(
                                'INSERT INTO geo_mentions '
                                '(tenant_id, response_id, brand_id, sentiment, sentiment_score, position, snippet) '
                                'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                                (tenant_id, rid, m['brand_id'], m['sentiment'],
                                 m['score'], m['position'], m['snippet'])
                            )
                            total_ment += 1
            polled += 1

        return resp(200, {'polled': polled, 'responses': total_resp, 'mentions': total_ment})
    finally:
        conn.close()
