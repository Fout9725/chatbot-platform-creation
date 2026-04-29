"""
Business: Аутентификация для GEO-платформы (регистрация, вход, профиль).
Создаёт tenant + user, выдаёт JWT-токен. Возвращает данные текущего пользователя.
Args: event с httpMethod, headers (X-Auth-Token), body (json email/password/company)
Returns: HTTP-ответ с токеном и данными пользователя
"""
import json
import os
import hmac
import hashlib
import base64
import time
import secrets
import re
import psycopg2
from psycopg2.extras import RealDictCursor


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def resp(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def b64url_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def jwt_encode(payload: dict, secret: str) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    h = b64url(json.dumps(header, separators=(',', ':')).encode())
    p = b64url(json.dumps(payload, separators=(',', ':')).encode())
    sig_input = f'{h}.{p}'.encode()
    sig = hmac.new(secret.encode(), sig_input, hashlib.sha256).digest()
    return f'{h}.{p}.{b64url(sig)}'


def jwt_decode(token: str, secret: str) -> dict | None:
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


def hash_password(password: str, salt: str | None = None) -> str:
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 200_000)
    return f'pbkdf2$200000${salt}${dk.hex()}'


def verify_password(password: str, hashed: str) -> bool:
    try:
        algo, iters, salt, hex_hash = hashed.split('$')
        if algo != 'pbkdf2':
            return False
        dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), int(iters))
        return hmac.compare_digest(dk.hex(), hex_hash)
    except Exception:
        return False


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_from_token(headers: dict) -> dict | None:
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    secret = os.environ.get('GEO_JWT_SECRET', 'dev-secret')
    payload = jwt_decode(token, secret)
    if not payload:
        return None
    return payload


def make_token(user_id: str, tenant_id: str) -> str:
    secret = os.environ.get('GEO_JWT_SECRET', 'dev-secret')
    now = int(time.time())
    return jwt_encode({
        'sub': user_id,
        'tid': tenant_id,
        'iat': now,
        'exp': now + 60 * 60 * 24 * 7,
    }, secret)


EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}

    path = event.get('path', '') or ''
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action') or ''
    if not action:
        if path.endswith('/register'): action = 'register'
        elif path.endswith('/login'): action = 'login'
        elif path.endswith('/me'): action = 'me'

    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}

    headers = event.get('headers') or {}

    if action == 'register' and method == 'POST':
        return register(body)
    if action == 'login' and method == 'POST':
        return login(body)
    if action == 'me' and method == 'GET':
        return me(headers)

    return resp(400, {'error': 'unknown_action', 'hint': 'use ?action=register|login|me'})


def register(body: dict):
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    company = (body.get('company') or '').strip() or 'My Company'

    if not EMAIL_RE.match(email):
        return resp(400, {'error': 'invalid_email'})
    if len(password) < 6:
        return resp(400, {'error': 'password_too_short'})

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('SELECT id FROM geo_users WHERE email = %s', (email,))
                if cur.fetchone():
                    return resp(409, {'error': 'email_taken'})

                cur.execute(
                    'INSERT INTO geo_tenants (name) VALUES (%s) RETURNING id',
                    (company,)
                )
                tenant_id = str(cur.fetchone()['id'])

                hashed = hash_password(password)
                cur.execute(
                    'INSERT INTO geo_users (tenant_id, email, hashed_password, is_owner) '
                    'VALUES (%s, %s, %s, TRUE) RETURNING id',
                    (tenant_id, email, hashed)
                )
                user_id = str(cur.fetchone()['id'])

        token = make_token(user_id, tenant_id)
        return resp(200, {
            'token': token,
            'user': {'id': user_id, 'email': email, 'tenant_id': tenant_id, 'company': company, 'is_owner': True},
        })
    finally:
        conn.close()


def login(body: dict):
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    if not email or not password:
        return resp(400, {'error': 'missing_credentials'})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT u.id, u.tenant_id, u.email, u.hashed_password, u.is_owner, t.name AS company '
                'FROM geo_users u JOIN geo_tenants t ON t.id = u.tenant_id '
                'WHERE u.email = %s AND u.is_active = TRUE',
                (email,)
            )
            row = cur.fetchone()
        if not row or not verify_password(password, row['hashed_password']):
            return resp(401, {'error': 'invalid_credentials'})

        token = make_token(str(row['id']), str(row['tenant_id']))
        return resp(200, {
            'token': token,
            'user': {
                'id': str(row['id']),
                'email': row['email'],
                'tenant_id': str(row['tenant_id']),
                'company': row['company'],
                'is_owner': row['is_owner'],
            },
        })
    finally:
        conn.close()


def me(headers: dict):
    payload = get_user_from_token(headers)
    if not payload:
        return resp(401, {'error': 'unauthorized'})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT u.id, u.tenant_id, u.email, u.is_owner, t.name AS company, t.plan '
                'FROM geo_users u JOIN geo_tenants t ON t.id = u.tenant_id '
                'WHERE u.id = %s',
                (payload['sub'],)
            )
            row = cur.fetchone()
        if not row:
            return resp(401, {'error': 'user_not_found'})
        return resp(200, {
            'user': {
                'id': str(row['id']),
                'email': row['email'],
                'tenant_id': str(row['tenant_id']),
                'company': row['company'],
                'plan': row['plan'],
                'is_owner': row['is_owner'],
            },
        })
    finally:
        conn.close()
