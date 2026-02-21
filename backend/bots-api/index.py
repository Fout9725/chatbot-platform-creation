"""API для управления ботами — CRUD операции, настройки и CRM-интеграции"""
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import html
import re
import time
from collections import defaultdict

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
request_counts = defaultdict(list)

def get_cors_headers(event):
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }

def check_rate_limit(ip, limit=60, window=60):
    now = time.time()
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return False
    request_counts[ip].append(now)
    return True

def sanitize_input(text, max_len=1000):
    if not text:
        return ''
    text = str(text)[:max_len]
    text = re.sub(r'<[^>]*>', '', text)
    text = html.escape(text)
    return text.strip()

def extract_ip(event):
    return event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')

def safe_error_response(error, context):
    return {
        'statusCode': 500,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Internal server error'})
    }

def serialize_bot(bot):
    bot_dict = dict(bot)
    bot_dict['created_at'] = bot_dict['created_at'].isoformat() if bot_dict.get('created_at') else None
    bot_dict['updated_at'] = bot_dict['updated_at'].isoformat() if bot_dict.get('updated_at') else None
    return bot_dict

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """API для управления ботами — создание, обновление, получение, CRM-интеграции"""
    method: str = event.get('httpMethod', 'GET')
    cors_headers = get_cors_headers(event)

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    ip_address = extract_ip(event)
    if not check_rate_limit(ip_address, limit=60, window=60):
        return {'statusCode': 429, 'headers': cors_headers, 'body': json.dumps({'error': 'Too many requests'})}

    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'DATABASE_URL not configured'})}

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        params = event.get('queryStringParameters') or {}

        if method == 'GET':
            action = params.get('action', '')

            if action == 'crm_list':
                bot_id = params.get('bot_id')
                if not bot_id:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'bot_id required'})}
                cur.execute(
                    f"SELECT id, bot_id, crm_type, api_key, webhook_url, settings, is_active, created_at, updated_at FROM {SCHEMA}.crm_integrations WHERE bot_id = %s ORDER BY created_at DESC",
                    (int(bot_id),)
                )
                rows = cur.fetchall()
                integrations = []
                for r in rows:
                    d = dict(r)
                    d['created_at'] = d['created_at'].isoformat() if d.get('created_at') else None
                    d['updated_at'] = d['updated_at'].isoformat() if d.get('updated_at') else None
                    if d.get('api_key'):
                        key = d['api_key']
                        d['api_key_masked'] = key[:8] + '...' + key[-4:] if len(key) > 12 else '***'
                    else:
                        d['api_key_masked'] = None
                    integrations.append(d)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'integrations': integrations})}

            bot_id = params.get('id')
            if bot_id:
                cur.execute(f"SELECT * FROM {SCHEMA}.bots WHERE id = %s", (bot_id,))
                bot = cur.fetchone()
                if bot:
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'bot': serialize_bot(bot)})}
                return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Bot not found'})}

            cur.execute(f"SELECT * FROM {SCHEMA}.bots ORDER BY created_at DESC")
            bots = cur.fetchall()
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'bots': [serialize_bot(b) for b in bots]})}

        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'create_bot')

            if action == 'crm_save':
                bot_id = body_data.get('bot_id')
                crm_type = sanitize_input(body_data.get('crm_type', ''), 50)
                api_key = body_data.get('api_key', '').strip()
                webhook_url = sanitize_input(body_data.get('webhook_url', ''), 500)
                crm_settings = body_data.get('settings', {})
                integration_id = body_data.get('id')

                if not bot_id or not crm_type:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'bot_id and crm_type required'})}

                if integration_id:
                    cur.execute(
                        f"UPDATE {SCHEMA}.crm_integrations SET crm_type = %s, api_key = %s, webhook_url = %s, settings = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND bot_id = %s RETURNING id",
                        (crm_type, api_key, webhook_url, json.dumps(crm_settings), int(integration_id), int(bot_id))
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.crm_integrations (bot_id, crm_type, api_key, webhook_url, settings) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (int(bot_id), crm_type, api_key, webhook_url, json.dumps(crm_settings))
                    )
                row = cur.fetchone()
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'ok': True, 'id': row['id'] if row else None})}

            if action == 'crm_delete':
                integration_id = body_data.get('id')
                if not integration_id:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'id required'})}
                cur.execute(f"UPDATE {SCHEMA}.crm_integrations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (int(integration_id),))
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'ok': True})}

            if action == 'crm_toggle':
                integration_id = body_data.get('id')
                is_active = body_data.get('is_active', True)
                if not integration_id:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'id required'})}
                cur.execute(
                    f"UPDATE {SCHEMA}.crm_integrations SET is_active = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (bool(is_active), int(integration_id))
                )
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'ok': True})}

            name = sanitize_input(body_data.get('name'), 200)
            if not name:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'name is required'})}
            description = sanitize_input(body_data.get('description', ''), 1000)
            ai_model = sanitize_input(body_data.get('ai_model', 'google/gemini-2.0-flash-exp:free'), 200)
            ai_prompt = sanitize_input(body_data.get('ai_prompt', ''), 5000)
            settings_json = json.dumps(body_data.get('settings', {}))

            cur.execute(
                f"INSERT INTO {SCHEMA}.bots (name, bot_type, platform, description, ai_model, ai_prompt, settings, status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft') RETURNING *",
                (name, body_data.get('bot_type', 'chatbot'), body_data.get('platform', 'telegram'), description, ai_model, ai_prompt, settings_json)
            )
            new_bot = cur.fetchone()
            return {'statusCode': 201, 'headers': cors_headers, 'body': json.dumps({'bot': serialize_bot(new_bot)})}

        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            bot_id = body_data.get('id')
            if not bot_id:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'id is required'})}

            ALLOWED_FIELDS = {'name', 'description', 'ai_model', 'ai_prompt', 'status', 'settings'}
            update_fields = []
            update_values = []

            for field in body_data:
                if field in ALLOWED_FIELDS:
                    value = body_data[field]
                    if field == 'name':
                        value = sanitize_input(value, 200)
                    elif field == 'description':
                        value = sanitize_input(value, 1000)
                    elif field == 'ai_model':
                        value = sanitize_input(value, 200)
                    elif field == 'ai_prompt':
                        value = sanitize_input(value, 5000)
                    elif field == 'settings':
                        value = json.dumps(value) if isinstance(value, dict) else value
                    update_fields.append(f'{field} = %s')
                    update_values.append(value)

            if not update_fields:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'No valid fields to update'})}

            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            update_values.append(int(bot_id))

            cur.execute(
                f"UPDATE {SCHEMA}.bots SET {', '.join(update_fields)} WHERE id = %s RETURNING *",
                tuple(update_values)
            )
            updated_bot = cur.fetchone()
            if updated_bot:
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'bot': serialize_bot(updated_bot)})}
            return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Bot not found'})}

        cur.close()
        conn.close()

    except Exception as e:
        return safe_error_response(e, context)

    return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}
