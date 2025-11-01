import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Универсальный API для ботов, статистики и ИИ-помощника
    Args: event - dict с httpMethod, pathParams, body
          context - объект с request_id
    Returns: HTTP response
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id', headers.get('x-user-id', '1'))
        path_params = event.get('pathParams', {})
        resource = path_params.get('resource', 'bots')
        action = path_params.get('action')
        
        if resource == 'bots':
            return handle_bots(cur, conn, method, user_id, action, event)
        elif resource == 'statistics':
            return handle_statistics(cur, conn, method, event)
        elif resource == 'assistant':
            return handle_assistant(cur, conn, method, user_id, action, event)
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Resource not found'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()


def handle_bots(cur, conn, method: str, user_id: str, action: str, event: Dict) -> Dict:
    if method == 'GET':
        if action:
            cur.execute(
                "SELECT * FROM t_p60354232_chatbot_platform_cre.bots WHERE id = %s AND user_id = %s",
                (action, user_id)
            )
            bot = cur.fetchone()
            
            if not bot:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Bot not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(bot), default=str),
                'isBase64Encoded': False
            }
        else:
            cur.execute(
                "SELECT * FROM t_p60354232_chatbot_platform_cre.bots WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            bots = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(bot) for bot in bots], default=str),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        description = body.get('description', '')
        bot_type = body.get('type', 'visual')
        visual_config = json.dumps(body.get('visual_config', {}))
        code_config = body.get('code_config', '')
        
        cur.execute(
            """INSERT INTO t_p60354232_chatbot_platform_cre.bots 
            (user_id, name, description, type, visual_config, code_config) 
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (user_id, name, description, bot_type, visual_config, code_config)
        )
        new_bot = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(new_bot), default=str),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        
        update_fields = []
        params = []
        
        if 'name' in body:
            update_fields.append('name = %s')
            params.append(body['name'])
        if 'description' in body:
            update_fields.append('description = %s')
            params.append(body['description'])
        if 'visual_config' in body:
            update_fields.append('visual_config = %s')
            params.append(json.dumps(body['visual_config']))
        if 'code_config' in body:
            update_fields.append('code_config = %s')
            params.append(body['code_config'])
        if 'is_active' in body:
            update_fields.append('is_active = %s')
            params.append(body['is_active'])
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        params.extend([action, user_id])
        
        cur.execute(
            f"""UPDATE t_p60354232_chatbot_platform_cre.bots 
            SET {', '.join(update_fields)} 
            WHERE id = %s AND user_id = %s RETURNING *""",
            params
        )
        updated_bot = cur.fetchone()
        conn.commit()
        
        if not updated_bot:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(updated_bot), default=str),
            'isBase64Encoded': False
        }


def handle_statistics(cur, conn, method: str, event: Dict) -> Dict:
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        bot_id = params.get('bot_id')
        days = int(params.get('days', '30'))
        
        if not bot_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'bot_id is required'}),
                'isBase64Encoded': False
            }
        
        start_date = (datetime.now() - timedelta(days=days)).date()
        
        cur.execute(
            """SELECT date, messages_sent, messages_received, unique_users, active_conversations
            FROM t_p60354232_chatbot_platform_cre.bot_statistics
            WHERE bot_id = %s AND date >= %s
            ORDER BY date ASC""",
            (bot_id, start_date)
        )
        stats = cur.fetchall()
        
        total_messages = sum(s['messages_sent'] + s['messages_received'] for s in stats)
        total_users = sum(s['unique_users'] for s in stats)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'daily_stats': [dict(s) for s in stats],
                'summary': {
                    'total_messages': total_messages,
                    'total_users': total_users,
                    'days': len(stats)
                }
            }, default=str),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        bot_id = body.get('bot_id')
        date = body.get('date', datetime.now().date().isoformat())
        
        cur.execute(
            """INSERT INTO t_p60354232_chatbot_platform_cre.bot_statistics 
            (bot_id, date, messages_sent, messages_received, unique_users, active_conversations)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (bot_id, date) 
            DO UPDATE SET 
                messages_sent = bot_statistics.messages_sent + EXCLUDED.messages_sent,
                messages_received = bot_statistics.messages_received + EXCLUDED.messages_received,
                unique_users = EXCLUDED.unique_users,
                active_conversations = EXCLUDED.active_conversations
            RETURNING *""",
            (
                bot_id, 
                date,
                body.get('messages_sent', 0),
                body.get('messages_received', 0),
                body.get('unique_users', 0),
                body.get('active_conversations', 0)
            )
        )
        result = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(result), default=str),
            'isBase64Encoded': False
        }


def handle_assistant(cur, conn, method: str, user_id: str, action: str, event: Dict) -> Dict:
    if method == 'POST' and action == 'track':
        body = json.loads(event.get('body', '{}'))
        
        cur.execute(
            """INSERT INTO t_p60354232_chatbot_platform_cre.user_actions 
            (user_id, action_type, action_data, page_url) 
            VALUES (%s, %s, %s, %s)""",
            (user_id, body.get('action_type'), json.dumps(body.get('action_data', {})), body.get('page_url'))
        )
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': 'tracked'}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST' and action == 'chat':
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        
        cur.execute(
            """INSERT INTO t_p60354232_chatbot_platform_cre.assistant_chats 
            (user_id, message, sender) VALUES (%s, %s, 'user')""",
            (user_id, user_message)
        )
        
        cur.execute(
            """SELECT message, sender FROM t_p60354232_chatbot_platform_cre.assistant_chats 
            WHERE user_id = %s ORDER BY created_at DESC LIMIT 10""",
            (user_id,)
        )
        chat_history = cur.fetchall()
        
        cur.execute(
            """SELECT action_type, action_data FROM t_p60354232_chatbot_platform_cre.user_actions 
            WHERE user_id = %s ORDER BY created_at DESC LIMIT 10""",
            (user_id,)
        )
        user_actions = cur.fetchall()
        
        context_info = f"Недавние действия: {', '.join([a['action_type'] for a in user_actions])}"
        
        system_prompt = f"""Ты - помощник платформы для создания чат-ботов. 

Платформа включает:
- Конструктор ботов (визуальный и профессиональный)
- Интеграции с Telegram и WhatsApp
- Маркетплейс готовых ботов
- Статистика
- Тарифы: Бесплатный, Оптимальный, Премиум, Партнёрский

{context_info}

Отвечай кратко, давай конкретные советы."""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for chat in reversed(chat_history):
            role = "user" if chat['sender'] == 'user' else "assistant"
            messages.append({"role": role, "content": chat['message']})
        
        try:
            groq_api_key = os.environ.get('GROQ_API_KEY')
            if groq_api_key:
                response = requests.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {groq_api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': 'llama-3.1-8b-instant',
                        'messages': messages,
                        'temperature': 0.7,
                        'max_tokens': 300
                    },
                    timeout=20
                )
                response.raise_for_status()
                ai_response = response.json()['choices'][0]['message']['content']
            else:
                ai_response = "Привет! Я помощник платформы. Чем могу помочь?"
        except Exception:
            ai_response = "Привет! Чем могу помочь в работе с платформой?"
        
        cur.execute(
            """INSERT INTO t_p60354232_chatbot_platform_cre.assistant_chats 
            (user_id, message, sender) VALUES (%s, %s, 'assistant')""",
            (user_id, ai_response)
        )
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': ai_response}),
            'isBase64Encoded': False
        }
    
    elif method == 'GET' and action == 'history':
        cur.execute(
            """SELECT message, sender, created_at FROM t_p60354232_chatbot_platform_cre.assistant_chats 
            WHERE user_id = %s ORDER BY created_at ASC LIMIT 50""",
            (user_id,)
        )
        history = cur.fetchall()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(h) for h in history], default=str),
            'isBase64Encoded': False
        }
