import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Синхронизация пользователей с базой данных
    Args: event - dict с httpMethod, body (userData)
          context - объект с request_id
    Returns: HTTP response с результатом синхронизации
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
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
                    'name': user.get('name', 'Пользователь'),
                    'role': user.get('role', 'user'),
                    'plan': user.get('plan', 'free'),
                    'created_at': user['created_at'].isoformat() if user.get('created_at') else None
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'users': users_list, 'total': len(users_list)})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_id: str = body_data.get('id', '')
            email: str = body_data.get('email', '')
            name: str = body_data.get('name', 'Пользователь')
            role: str = body_data.get('role', 'user')
            plan: str = body_data.get('plan', 'free')
            
            if not email:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email is required'})
                }
            
            cur.execute(
                "INSERT INTO users (email, name, role, plan) VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan "
                "RETURNING id",
                (email, name, role, plan)
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'userId': result['id']})
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }
