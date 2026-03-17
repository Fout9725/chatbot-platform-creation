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
FALLBACK_PASSWORD = 'neuro2024'


def get_admin_password_hash():
    admin_pw = os.environ.get('ADMIN_PASSWORD', FALLBACK_PASSWORD)
    return hashlib.sha256(admin_pw.encode()).hexdigest()


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def handler(event, context):
    """Авторизация администратора — проверка пароля, токен, сброс"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'login')

        if action == 'login':
            password = body.get('password', '')
            pw_hash = hashlib.sha256(password.encode()).hexdigest()

            if pw_hash != get_admin_password_hash():
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
                    f"DELETE FROM {SCHEMA}.admin_sessions WHERE expires_at < CURRENT_TIMESTAMP"
                )
                cur.execute(
                    f"INSERT INTO {SCHEMA}.admin_sessions (token, expires_at) "
                    f"VALUES (%s, CURRENT_TIMESTAMP + INTERVAL '24 hours') RETURNING id",
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
                    'expires_in': 86400
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

        if action == 'reset_sessions':
            password = body.get('password', '')
            pw_hash = hashlib.sha256(password.encode()).hexdigest()
            if pw_hash != get_admin_password_hash():
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный пароль'})}

            conn = get_db()
            cur = conn.cursor()
            try:
                cur.execute(f"DELETE FROM {SCHEMA}.admin_sessions")
            finally:
                cur.close()
                conn.close()

            token = secrets.token_urlsafe(48)
            conn = get_db()
            cur = conn.cursor()
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.admin_sessions (token, expires_at) "
                    f"VALUES (%s, CURRENT_TIMESTAMP + INTERVAL '24 hours') RETURNING id",
                    (token,)
                )
            finally:
                cur.close()
                conn.close()

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'ok': True, 'token': token, 'message': 'Все сессии сброшены, выдан новый токен'})
            }

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддержан'})}