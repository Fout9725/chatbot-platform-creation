"""
Business: CRUD брендов в рамках tenant. Свои бренды и конкуренты.
Args: event с httpMethod, headers (X-Auth-Token), body или queryStringParameters
Returns: HTTP-ответ со списком брендов или результатом операции
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
    if not payload:
        return None
    return payload.get('tid')


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resolve_project(cur, tenant_id: str, project_id):
    """
    Возвращает валидный project_id: либо переданный (если принадлежит tenant),
    либо дефолтный проект tenant'а. Гарантирует наличие хотя бы одного проекта.
    """
    if project_id:
        cur.execute('SELECT id FROM geo_projects WHERE tenant_id = %s AND id = %s',
                    (tenant_id, project_id))
        row = cur.fetchone()
        if row:
            return str(row['id'])
    cur.execute(
        'SELECT id FROM geo_projects WHERE tenant_id = %s ORDER BY is_default DESC, created_at ASC LIMIT 1',
        (tenant_id,)
    )
    row = cur.fetchone()
    if row:
        return str(row['id'])
    cur.execute(
        'INSERT INTO geo_projects (tenant_id, name, is_default) VALUES (%s, %s, TRUE) RETURNING id',
        (tenant_id, 'Основной проект')
    )
    return str(cur.fetchone()['id'])


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

    project_id = qs.get('project_id') or body.get('project_id')

    if method == 'GET':
        return list_brands(tenant_id, project_id)
    if method == 'POST':
        return create_brand(tenant_id, body, project_id)
    if method == 'PUT':
        return update_brand(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_brand(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def list_brands(tenant_id: str, project_id=None):
    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                pid = resolve_project(cur, tenant_id, project_id)
                cur.execute(
                    'SELECT id, name, aliases, is_own, created_at FROM geo_brands '
                    'WHERE tenant_id = %s AND project_id = %s ORDER BY is_own DESC, created_at ASC',
                    (tenant_id, pid)
                )
                rows = cur.fetchall()
        return resp(200, {'brands': [{
            'id': str(r['id']), 'name': r['name'], 'aliases': r['aliases'] or [],
            'is_own': r['is_own'], 'created_at': r['created_at'].isoformat()
        } for r in rows]})
    finally:
        conn.close()


def create_brand(tenant_id: str, body: dict, project_id=None):
    name = (body.get('name') or '').strip()
    if not name:
        return resp(400, {'error': 'name_required'})
    aliases = body.get('aliases') or []
    if isinstance(aliases, str):
        aliases = [a.strip() for a in aliases.split(',') if a.strip()]
    is_own = bool(body.get('is_own', False))

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                pid = resolve_project(cur, tenant_id, project_id)
                if is_own:
                    # только один свой бренд в рамках проекта
                    cur.execute(
                        'UPDATE geo_brands SET is_own = FALSE '
                        'WHERE tenant_id = %s AND project_id = %s AND is_own = TRUE',
                        (tenant_id, pid)
                    )
                cur.execute(
                    'INSERT INTO geo_brands (tenant_id, project_id, name, aliases, is_own) '
                    'VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at',
                    (tenant_id, pid, name, aliases, is_own)
                )
                row = cur.fetchone()
        return resp(200, {'brand': {
            'id': str(row['id']), 'name': name, 'aliases': aliases, 'is_own': is_own,
            'created_at': row['created_at'].isoformat()
        }})
    finally:
        conn.close()


def update_brand(tenant_id: str, brand_id: str, body: dict):
    if not brand_id:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []
    if 'name' in body:
        fields.append('name = %s'); values.append(body['name'].strip())
    if 'aliases' in body:
        a = body['aliases']
        if isinstance(a, str):
            a = [x.strip() for x in a.split(',') if x.strip()]
        fields.append('aliases = %s'); values.append(a)
    if 'is_own' in body:
        fields.append('is_own = %s'); values.append(bool(body['is_own']))
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, brand_id])

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if body.get('is_own') is True:
                    # отключаем is_own у остальных брендов того же проекта
                    cur.execute(
                        'UPDATE geo_brands SET is_own = FALSE '
                        'WHERE tenant_id = %s AND id <> %s AND is_own = TRUE '
                        'AND project_id = (SELECT project_id FROM geo_brands WHERE tenant_id = %s AND id = %s)',
                        (tenant_id, brand_id, tenant_id, brand_id)
                    )
                cur.execute(
                    f"UPDATE geo_brands SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_brand(tenant_id: str, brand_id: str):
    if not brand_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE geo_brands SET name = name WHERE tenant_id = %s AND id = %s',
                    (tenant_id, brand_id)
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
                cur.execute('DELETE FROM geo_mentions WHERE tenant_id = %s AND brand_id = %s', (tenant_id, brand_id))
                cur.execute('DELETE FROM geo_brands WHERE tenant_id = %s AND id = %s', (tenant_id, brand_id))
        return resp(200, {'ok': True})
    finally:
        conn.close()