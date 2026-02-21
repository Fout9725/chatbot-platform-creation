"""Проверка пароля администратора через бэкенд"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
ADMIN_PASSWORD_HASH = hashlib.sha256('neuro2024'.encode()).hexdigest()


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def handler(event, context):
    """Авторизация администратора — проверка пароля и выдача токена"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'login')

        if action == 'login':
            password = body.get('password', '')
            pw_hash = hashlib.sha256(password.encode()).hexdigest()

            if pw_hash != ADMIN_PASSWORD_HASH:
                return {
                    'statusCode': 401,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Неверный пароль'})
                }

            token = secrets.token_urlsafe(48)
            conn = get_db()
            cur = conn.cursor()
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.admin_sessions (token, expires_at) "
                    f"VALUES (%s, CURRENT_TIMESTAMP + INTERVAL '4 hours') RETURNING id",
                    (token,)
                )
                session_id = cur.fetchone()[0]
            finally:
                cur.close()
                conn.close()

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'ok': True,
                    'token': token,
                    'expires_in': 14400
                })
            }

        if action == 'verify':
            token = body.get('token', '')
            if not token:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': False})}

            conn = get_db()
            cur = conn.cursor()
            try:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > CURRENT_TIMESTAMP",
                    (token,)
                )
                row = cur.fetchone()
            finally:
                cur.close()
                conn.close()

            if row:
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': True})}
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': False})}

        if action == 'logout':
            token = body.get('token', '')
            if token:
                conn = get_db()
                cur = conn.cursor()
                try:
                    cur.execute(
                        f"UPDATE {SCHEMA}.admin_sessions SET expires_at = CURRENT_TIMESTAMP WHERE token = %s",
                        (token,)
                    )
                finally:
                    cur.close()
                    conn.close()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддержан'})}
