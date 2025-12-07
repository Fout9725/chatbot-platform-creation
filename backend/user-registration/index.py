import json
import os
import re
from typing import Dict, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Регистрация пользователей на платформе с полной интеграцией в административную панель
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            return get_users(conn, event)
        elif method == 'POST':
            return register_user(conn, event)
        elif method == 'PUT':
            return update_user(conn, event)
        elif method == 'DELETE':
            return delete_user(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()


def get_users(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    user_id = params.get('id')
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if user_id:
        cur.execute("SELECT id, email, username, full_name, phone, avatar_url, email_verified, is_active, role, created_at, updated_at, last_login_at, metadata FROM platform_users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(user), default=str),
            'isBase64Encoded': False
        }
    else:
        cur.execute("SELECT id, email, username, full_name, phone, avatar_url, email_verified, is_active, role, created_at, updated_at, last_login_at, metadata FROM platform_users ORDER BY created_at DESC")
        users = cur.fetchall()
        cur.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(u) for u in users], default=str),
            'isBase64Encoded': False
        }


def register_user(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
    email = body.get('email', '').strip()
    password = body.get('password', '').strip()
    username = body.get('username', '').strip()
    full_name = body.get('full_name', '').strip()
    phone = body.get('phone', '').strip()
    role = body.get('role', 'user')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password are required'}),
            'isBase64Encoded': False
        }
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid email format'}),
            'isBase64Encoded': False
        }
    
    if len(password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Password must be at least 6 characters'}),
            'isBase64Encoded': False
        }
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT id FROM platform_users WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        return {
            'statusCode': 409,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email already registered'}),
            'isBase64Encoded': False
        }
    
    if username:
        cur.execute("SELECT id FROM platform_users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username already taken'}),
                'isBase64Encoded': False
            }
    
    cur.execute("""
        INSERT INTO platform_users (email, username, password_hash, full_name, phone, role, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, email, username, full_name, phone, role, created_at
    """, (email, username or None, password_hash, full_name or None, phone or None, role, json.dumps({'registered_from': 'api'})))
    
    new_user = cur.fetchone()
    conn.commit()
    cur.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': dict(new_user)
        }, default=str),
        'isBase64Encoded': False
    }


def update_user(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID is required'}),
            'isBase64Encoded': False
        }
    
    updates = []
    params = []
    
    if 'full_name' in body:
        updates.append('full_name = %s')
        params.append(body['full_name'])
    if 'phone' in body:
        updates.append('phone = %s')
        params.append(body['phone'])
    if 'avatar_url' in body:
        updates.append('avatar_url = %s')
        params.append(body['avatar_url'])
    if 'email_verified' in body:
        updates.append('email_verified = %s')
        params.append(body['email_verified'])
    if 'is_active' in body:
        updates.append('is_active = %s')
        params.append(body['is_active'])
    if 'role' in body:
        updates.append('role = %s')
        params.append(body['role'])
    if 'metadata' in body:
        updates.append('metadata = %s')
        params.append(json.dumps(body['metadata']))
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(user_id)
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f"UPDATE platform_users SET {', '.join(updates)} WHERE id = %s RETURNING id, email, username, full_name, phone, avatar_url, email_verified, is_active, role, updated_at"
    cur.execute(query, params)
    
    updated_user = cur.fetchone()
    conn.commit()
    cur.close()
    
    if not updated_user:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': dict(updated_user)
        }, default=str),
        'isBase64Encoded': False
    }


def delete_user(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    user_id = params.get('id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID is required'}),
            'isBase64Encoded': False
        }
    
    cur = conn.cursor()
    cur.execute("DELETE FROM platform_users WHERE id = %s", (user_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    
    if not deleted:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': 'User deleted'}),
        'isBase64Encoded': False
    }
