import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400'
}

def make_response(status_code: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, default=str)
    }

def handle_register(cur, conn, body_data: dict) -> Dict[str, Any]:
    email = body_data.get('email', '').strip().lower()
    name = body_data.get('name', 'Пользователь').strip()
    password = body_data.get('password', '')

    if not email:
        return make_response(400, {'error': 'Email is required'})
    if not password:
        return make_response(400, {'error': 'Password is required'})
    if len(password) < 6:
        return make_response(400, {'error': 'Password must be at least 6 characters'})

    cur.execute('SELECT id FROM users WHERE email = %s', (email,))
    existing = cur.fetchone()
    if existing:
        return make_response(409, {'error': 'User with this email already exists'})

    password_hash = password if len(password) == 64 else hashlib.sha256(password.encode('utf-8')).hexdigest()

    cur.execute(
        "INSERT INTO users (email, full_name, role, plan_type, password_hash) "
        "VALUES (%s, %s, %s, %s, %s) "
        "RETURNING id, email, full_name, role, plan_type, avatar_url, created_at",
        (email, name, 'user', 'free', password_hash)
    )
    user_row = cur.fetchone()
    conn.commit()

    return make_response(200, {
        'success': True,
        'user': {
            'id': user_row['id'],
            'email': user_row['email'],
            'name': user_row.get('full_name', 'Пользователь'),
            'role': user_row.get('role', 'user'),
            'plan': user_row.get('plan_type', 'free'),
            'avatar': user_row.get('avatar_url'),
            'created_at': user_row['created_at'].isoformat() if user_row.get('created_at') else None
        }
    })

def handle_login(cur, body_data: dict) -> Dict[str, Any]:
    login_id = body_data.get('email', '').strip()
    password = body_data.get('password', '')

    if not login_id:
        return make_response(400, {'error': 'Login is required'})
    if not password:
        return make_response(400, {'error': 'Password is required'})

    cur.execute(
        'SELECT id, email, full_name, role, plan_type, avatar_url, password_hash, created_at FROM users WHERE email = %s',
        (login_id,)
    )
    user_row = cur.fetchone()

    if not user_row:
        return make_response(401, {'error': 'Invalid email or password'})

    stored_hash = user_row.get('password_hash')
    if not stored_hash:
        return make_response(401, {'error': 'Invalid email or password'})

    incoming_hash = password if len(password) == 64 else hashlib.sha256(password.encode('utf-8')).hexdigest()
    double_hash = hashlib.sha256(incoming_hash.encode('utf-8')).hexdigest()
    if incoming_hash != stored_hash and double_hash != stored_hash:
        return make_response(401, {'error': 'Invalid email or password'})

    return make_response(200, {
        'success': True,
        'user': {
            'id': user_row['id'],
            'email': user_row['email'],
            'name': user_row.get('full_name', 'Пользователь'),
            'role': user_row.get('role', 'user'),
            'plan': user_row.get('plan_type', 'free'),
            'avatar': user_row.get('avatar_url'),
            'created_at': user_row['created_at'].isoformat() if user_row.get('created_at') else None
        }
    })

def handle_sync(cur, conn, body_data: dict) -> Dict[str, Any]:
    """Legacy sync behavior: upsert user by email (no action field)."""
    email = body_data.get('email', '').strip()
    name = body_data.get('name', 'Пользователь')
    role = body_data.get('role', 'user')
    plan = body_data.get('plan', 'free')
    avatar = body_data.get('avatar', '')

    if not email:
        return make_response(400, {'error': 'Email is required'})

    cur.execute(
        "INSERT INTO users (email, full_name, role, plan_type, avatar_url) VALUES (%s, %s, %s, %s, %s) "
        "ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan_type = EXCLUDED.plan_type, avatar_url = EXCLUDED.avatar_url "
        "RETURNING id, avatar_url",
        (email, name, role, plan, avatar)
    )
    result = cur.fetchone()
    conn.commit()

    return make_response(200, {
        'success': True,
        'userId': result['id'],
        'user': {
            'avatar': result.get('avatar_url')
        }
    })

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User registration, login, and sync with database
    Args: event - dict с httpMethod, body (userData)
          context - объект с request_id
    Returns: HTTP response with result
    '''
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return make_response(500, {'error': 'Database connection not configured'})

    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if method == 'GET':
            cur.execute('SELECT * FROM users ORDER BY created_at DESC')
            users = cur.fetchall()

            users_list = []
            for user in users:
                users_list.append({
                    'id': user['id'],
                    'email': user['email'],
                    'name': user.get('full_name', 'Пользователь'),
                    'role': user.get('role', 'user'),
                    'plan': user.get('plan_type', 'free'),
                    'avatar': user.get('avatar_url'),
                    'created_at': user['created_at'].isoformat() if user.get('created_at') else None
                })

            cur.close()
            conn.close()

            return make_response(200, {'users': users_list, 'total': len(users_list)})

        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', None)

            if action == 'register':
                result = handle_register(cur, conn, body_data)
            elif action == 'login':
                result = handle_login(cur, body_data)
            else:
                # Legacy sync behavior (no action field)
                result = handle_sync(cur, conn, body_data)

            cur.close()
            conn.close()
            return result

        cur.close()
        conn.close()
        return make_response(405, {'error': 'Method not allowed'})

    except Exception as e:
        return make_response(500, {'error': f'Database error: {str(e)}'})