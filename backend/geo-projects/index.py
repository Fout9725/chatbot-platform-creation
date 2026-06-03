"""
Business: CRUD проектов (рабочих пространств бренда) в рамках tenant.
Каждый проект = отдельный продвигаемый бренд со своими запросами, контентом, публикациями и аналитикой.
Args: event с httpMethod (GET/POST/PUT/DELETE), headers (X-Auth-Token), body или queryStringParameters
Returns: HTTP-ответ со списком проектов или результатом операции
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
        return list_projects(tenant_id)
    if method == 'POST':
        return create_project(tenant_id, body)
    if method == 'PUT':
        return update_project(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_project(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def _ensure_default(cur, tenant_id: str):
    """Гарантируем, что у tenant есть хотя бы один проект."""
    cur.execute('SELECT COUNT(*) AS c FROM geo_projects WHERE tenant_id = %s', (tenant_id,))
    if int(cur.fetchone()['c']) == 0:
        cur.execute(
            'INSERT INTO geo_projects (tenant_id, name, is_default) VALUES (%s, %s, TRUE)',
            (tenant_id, 'Основной проект')
        )


def list_projects(tenant_id: str):
    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                _ensure_default(cur, tenant_id)
                cur.execute(
                    """
                    SELECT p.id, p.name, p.description, p.is_default, p.created_at,
                           (SELECT name FROM geo_brands b
                            WHERE b.project_id = p.id AND b.is_own = TRUE LIMIT 1) AS own_brand,
                           (SELECT COUNT(*) FROM geo_brands b WHERE b.project_id = p.id) AS brands_count,
                           (SELECT COUNT(*) FROM geo_tracked_queries q WHERE q.project_id = p.id) AS queries_count
                    FROM geo_projects p
                    WHERE p.tenant_id = %s
                    ORDER BY p.is_default DESC, p.created_at ASC
                    """,
                    (tenant_id,)
                )
                rows = cur.fetchall()
        return resp(200, {'projects': [{
            'id': str(r['id']), 'name': r['name'], 'description': r['description'],
            'is_default': r['is_default'],
            'own_brand': r['own_brand'],
            'brands_count': int(r['brands_count'] or 0),
            'queries_count': int(r['queries_count'] or 0),
            'created_at': r['created_at'].isoformat(),
        } for r in rows]})
    finally:
        conn.close()


def create_project(tenant_id: str, body: dict):
    name = (body.get('name') or '').strip()
    if not name:
        return resp(400, {'error': 'name_required'})
    if len(name) > 255:
        return resp(400, {'error': 'name_too_long'})
    description = (body.get('description') or '').strip() or None

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'INSERT INTO geo_projects (tenant_id, name, description, is_default) '
                    'VALUES (%s, %s, %s, FALSE) RETURNING id, created_at',
                    (tenant_id, name, description)
                )
                row = cur.fetchone()
        return resp(200, {'project': {
            'id': str(row['id']), 'name': name, 'description': description,
            'is_default': False, 'own_brand': None, 'brands_count': 0, 'queries_count': 0,
            'created_at': row['created_at'].isoformat(),
        }})
    finally:
        conn.close()


def update_project(tenant_id: str, pid: str, body: dict):
    if not pid:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []
    if 'name' in body:
        name = (body['name'] or '').strip()
        if not name:
            return resp(400, {'error': 'name_required'})
        fields.append('name = %s'); values.append(name)
    if 'description' in body:
        fields.append('description = %s'); values.append((body.get('description') or '').strip() or None)
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, pid])

    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_projects SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_project(tenant_id: str, pid: str):
    if not pid:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Нельзя удалить последний/дефолтный проект
                cur.execute('SELECT COUNT(*) AS c FROM geo_projects WHERE tenant_id = %s', (tenant_id,))
                if int(cur.fetchone()['c']) <= 1:
                    return resp(400, {'error': 'cannot_delete_last',
                                      'message': 'Нельзя удалить единственный проект.'})
                cur.execute('SELECT is_default FROM geo_projects WHERE tenant_id = %s AND id = %s',
                            (tenant_id, pid))
                row = cur.fetchone()
                if not row:
                    return resp(404, {'error': 'not_found'})
                if row['is_default']:
                    return resp(400, {'error': 'cannot_delete_default',
                                      'message': 'Нельзя удалить основной проект. Сначала назначьте основным другой.'})

                # Удаляем все данные проекта (упоминания → ответы → запросы/публикации/контент/бренды)
                cur.execute(
                    'DELETE FROM geo_mentions WHERE response_id IN '
                    '(SELECT r.id FROM geo_llm_responses r '
                    ' JOIN geo_tracked_queries q ON q.id = r.query_id '
                    ' WHERE q.project_id = %s)',
                    (pid,)
                )
                cur.execute(
                    'DELETE FROM geo_llm_responses WHERE query_id IN '
                    '(SELECT id FROM geo_tracked_queries WHERE project_id = %s)',
                    (pid,)
                )
                cur.execute('DELETE FROM geo_publication_checks_v2 WHERE publication_id IN '
                            '(SELECT id FROM geo_publications_v2 WHERE project_id = %s)', (pid,))
                cur.execute('DELETE FROM geo_publications_v2 WHERE project_id = %s', (pid,))
                cur.execute('DELETE FROM geo_drafts WHERE project_id = %s', (pid,))
                cur.execute('DELETE FROM geo_tracked_queries WHERE project_id = %s', (pid,))
                cur.execute('DELETE FROM geo_mentions WHERE brand_id IN '
                            '(SELECT id FROM geo_brands WHERE project_id = %s)', (pid,))
                cur.execute('DELETE FROM geo_brands WHERE project_id = %s', (pid,))
                cur.execute('DELETE FROM geo_projects WHERE tenant_id = %s AND id = %s', (tenant_id, pid))
        return resp(200, {'ok': True})
    finally:
        conn.close()
