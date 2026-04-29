"""
Business: Настройки tenant (расписание авто-опросов и проверок) + история запусков CRON.
Args: event с httpMethod=GET/PUT, headers (X-Auth-Token), action=runs для истории
Returns: настройки tenant или список последних запусков расписания
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
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def resp(status, body):
    return {'statusCode': status, 'headers': cors_headers(), 'isBase64Encoded': False,
            'body': json.dumps(body, ensure_ascii=False, default=str)}


def b64url_decode(s):
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def jwt_decode(token, secret):
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


def get_tenant(headers):
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
        if qs.get('action') == 'runs':
            try:
                limit = max(1, min(50, int(qs.get('limit', '20'))))
            except (TypeError, ValueError):
                limit = 20
            return list_runs(tenant_id, limit)
        return get_settings(tenant_id)
    if method == 'PUT':
        return update_settings(tenant_id, body)
    return resp(405, {'error': 'method_not_allowed'})


def get_settings(tenant_id):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT name, plan, poll_enabled, poll_interval_hours,
                       pub_check_enabled, pub_check_interval_hours,
                       last_auto_poll_at, last_auto_pub_check_at
                FROM geo_tenants WHERE id = %s
                """,
                (tenant_id,)
            )
            r = cur.fetchone()
        if not r:
            return resp(404, {'error': 'not_found'})
        return resp(200, {'settings': {
            'company': r['name'], 'plan': r['plan'],
            'poll_enabled': r['poll_enabled'],
            'poll_interval_hours': r['poll_interval_hours'],
            'pub_check_enabled': r['pub_check_enabled'],
            'pub_check_interval_hours': r['pub_check_interval_hours'],
            'last_auto_poll_at': r['last_auto_poll_at'].isoformat() if r['last_auto_poll_at'] else None,
            'last_auto_pub_check_at': r['last_auto_pub_check_at'].isoformat() if r['last_auto_pub_check_at'] else None,
        }})
    finally:
        conn.close()


def update_settings(tenant_id, body):
    fields, values = [], []
    if 'poll_enabled' in body:
        fields.append('poll_enabled = %s'); values.append(bool(body['poll_enabled']))
    if 'poll_interval_hours' in body:
        try:
            v = max(1, min(168, int(body['poll_interval_hours'])))
        except (TypeError, ValueError):
            return resp(400, {'error': 'bad_poll_interval'})
        fields.append('poll_interval_hours = %s'); values.append(v)
    if 'pub_check_enabled' in body:
        fields.append('pub_check_enabled = %s'); values.append(bool(body['pub_check_enabled']))
    if 'pub_check_interval_hours' in body:
        try:
            v = max(24, min(720, int(body['pub_check_interval_hours'])))
        except (TypeError, ValueError):
            return resp(400, {'error': 'bad_pub_check_interval'})
        fields.append('pub_check_interval_hours = %s'); values.append(v)
    if 'company' in body:
        c = (body.get('company') or '').strip()
        if c:
            fields.append('name = %s'); values.append(c)
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.append(tenant_id)

    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_tenants SET {', '.join(fields)} WHERE id = %s",
                    values
                )
        return get_settings(tenant_id)
    finally:
        conn.close()


def list_runs(tenant_id, limit):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, kind, status, polled, responses, mentions,
                       checked, found, error, started_at, finished_at
                FROM geo_schedule_runs
                WHERE tenant_id = %s
                ORDER BY started_at DESC
                LIMIT %s
                """,
                (tenant_id, limit)
            )
            rows = cur.fetchall()
        return resp(200, {'runs': [{
            'id': str(r['id']), 'kind': r['kind'], 'status': r['status'],
            'polled': r['polled'], 'responses': r['responses'], 'mentions': r['mentions'],
            'checked': r['checked'], 'found': r['found'], 'error': r['error'],
            'started_at': r['started_at'].isoformat(),
            'finished_at': r['finished_at'].isoformat() if r['finished_at'] else None,
        } for r in rows]})
    finally:
        conn.close()
