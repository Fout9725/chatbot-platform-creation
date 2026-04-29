"""
Business: CRUD отслеживаемых поисковых запросов GEO-платформы.
Args: event с httpMethod, headers (X-Auth-Token), body или queryStringParameters
Returns: HTTP-ответ со списком запросов или результатом операции
"""
import json
import os
import hmac
import hashlib
import base64
import time
import psycopg2
from psycopg2.extras import RealDictCursor


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

    if method == 'GET':
        return list_queries(tenant_id)
    if method == 'POST':
        return create_query(tenant_id, body)
    if method == 'PUT':
        return update_query(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_query(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def list_queries(tenant_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT q.id, q.text, q.language, q.is_active, q.created_at,
                       (SELECT MAX(polled_at) FROM geo_llm_responses r WHERE r.query_id = q.id) AS last_polled,
                       (SELECT COUNT(*) FROM geo_llm_responses r WHERE r.query_id = q.id) AS responses_count
                FROM geo_tracked_queries q
                WHERE q.tenant_id = %s
                ORDER BY q.created_at DESC
                """,
                (tenant_id,)
            )
            rows = cur.fetchall()
        return resp(200, {'queries': [{
            'id': str(r['id']), 'text': r['text'], 'language': r['language'],
            'is_active': r['is_active'], 'created_at': r['created_at'].isoformat(),
            'last_polled': r['last_polled'].isoformat() if r['last_polled'] else None,
            'responses_count': r['responses_count'],
        } for r in rows]})
    finally:
        conn.close()


def create_query(tenant_id: str, body: dict):
    text = (body.get('text') or '').strip()
    if not text:
        return resp(400, {'error': 'text_required'})
    if len(text) > 1000:
        return resp(400, {'error': 'text_too_long'})
    language = body.get('language') or 'ru'
    is_active = bool(body.get('is_active', True))

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'INSERT INTO geo_tracked_queries (tenant_id, text, language, is_active) '
                    'VALUES (%s, %s, %s, %s) RETURNING id, created_at',
                    (tenant_id, text, language, is_active)
                )
                row = cur.fetchone()
        return resp(200, {'query': {
            'id': str(row['id']), 'text': text, 'language': language,
            'is_active': is_active, 'created_at': row['created_at'].isoformat(),
            'last_polled': None, 'responses_count': 0,
        }})
    finally:
        conn.close()


def update_query(tenant_id: str, qid: str, body: dict):
    if not qid:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []
    if 'text' in body:
        fields.append('text = %s'); values.append(body['text'].strip())
    if 'language' in body:
        fields.append('language = %s'); values.append(body['language'])
    if 'is_active' in body:
        fields.append('is_active = %s'); values.append(bool(body['is_active']))
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, qid])

    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_tracked_queries SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_query(tenant_id: str, qid: str):
    if not qid:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM geo_mentions WHERE tenant_id = %s AND response_id IN '
                    '(SELECT id FROM geo_llm_responses WHERE query_id = %s)',
                    (tenant_id, qid)
                )
                cur.execute('DELETE FROM geo_llm_responses WHERE tenant_id = %s AND query_id = %s', (tenant_id, qid))
                cur.execute('DELETE FROM geo_tracked_queries WHERE tenant_id = %s AND id = %s', (tenant_id, qid))
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()
