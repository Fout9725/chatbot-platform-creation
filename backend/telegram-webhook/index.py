"""Обработчик Telegram: подключение бота (connect) и приём сообщений (webhook)"""

import json
import os
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

OK_RESPONSE = {
    'statusCode': 200,
    'headers': CORS_HEADERS,
    'body': json.dumps({'ok': True})
}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def send_telegram_message(bot_token, chat_id, text):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


def call_ml_chat(bot_id, message, ml_chat_url):
    try:
        data = json.dumps({"bot_id": bot_id, "message": message}).encode('utf-8')
        req = urllib.request.Request(ml_chat_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result.get('content')
    except Exception:
        return None


def call_openrouter(model_id, message_text, system_prompt, knowledge_context, bot_token_for_key):
    """Вызывает OpenRouter API для генерации ответа через выбранную AI модель"""
    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        return None

    try:
        system_content = system_prompt or 'You are a helpful assistant.'
        if knowledge_context:
            system_content += f'\n\nRelevant knowledge base context:\n{knowledge_context}'

        messages = [
            {'role': 'system', 'content': system_content},
            {'role': 'user', 'content': message_text}
        ]

        payload = json.dumps({
            'model': model_id,
            'messages': messages
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            choices = result.get('choices', [])
            if choices and choices[0].get('message', {}).get('content'):
                return choices[0]['message']['content']
        return None
    except Exception:
        return None


def get_knowledge_response(bot_id, message_text, conn):
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT content FROM {SCHEMA}.knowledge_sources WHERE bot_id = %s AND status = 'ready' ORDER BY created_at DESC LIMIT 5",
            (bot_id,)
        )
        rows = cur.fetchall()
        cur.close()
        if not rows:
            return None

        msg_lower = message_text.lower()
        best_score = 0
        best_chunk = None
        for row in rows:
            if not row[0]:
                continue
            chunks = row[0].split('. ')
            for chunk in chunks:
                chunk_lower = chunk.lower()
                words = msg_lower.split()
                matches = sum(1 for w in words if len(w) > 3 and w in chunk_lower)
                if matches > best_score:
                    best_score = matches
                    best_chunk = chunk.strip()

        if best_score >= 2 and best_chunk:
            return best_chunk[:1000]
        return None
    except Exception:
        return None


def get_fallback_response(message_text):
    msg = message_text.lower().strip()
    if msg in ['привет', 'здравствуйте', 'hi', 'hello', '/start']:
        return 'Привет! Я бот-помощник. Чем могу помочь?'
    if msg in ['помощь', 'help', '/help']:
        return 'Я могу помочь вам с:\n- Информацией о продуктах\n- Ответами на вопросы\n- Поддержкой\n\nПросто напишите свой вопрос!'
    if any(w in msg for w in ['спасибо', 'thanks', 'благодарю']):
        return 'Пожалуйста! Обращайтесь, если возникнут вопросы.'
    return 'Спасибо за сообщение! Я обработал ваш запрос.'


def handle_connect(body):
    """Подключение/отключение Telegram бота — сохраняет токен, ставит webhook"""
    token = body.get('token', '').strip()
    bot_id = body.get('bot_id')
    action = body.get('action', 'connect')

    if not token:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Токен не указан'})}

    if action == 'disconnect':
        conn = get_db()
        cur = conn.cursor()
        try:
            try:
                req = urllib.request.Request(f'https://api.telegram.org/bot{token}/deleteWebhook')
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass
            if bot_id:
                cur.execute(
                    f"UPDATE {SCHEMA}.bots SET telegram_token = NULL, telegram_username = NULL, webhook_url = NULL, status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (int(bot_id),)
                )
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}
        finally:
            cur.close()
            conn.close()

    try:
        req = urllib.request.Request(f'https://api.telegram.org/bot{token}/getMe')
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Невалидный токен'})}

    if not data.get('ok'):
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Telegram отклонил токен'})}

    tg_username = data['result'].get('username', '')

    conn = get_db()
    cur = conn.cursor()
    try:
        if bot_id:
            cur.execute(
                f"UPDATE {SCHEMA}.bots SET telegram_token = %s, telegram_username = %s, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id",
                (token, tg_username, int(bot_id))
            )
            row = cur.fetchone()
            if not row:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.bots (name, bot_type, platform, telegram_token, telegram_username, status) VALUES (%s, 'chatbot', 'telegram', %s, %s, 'active') RETURNING id",
                    (f'@{tg_username}', token, tg_username)
                )
                row = cur.fetchone()
            db_bot_id = row[0]
        else:
            cur.execute(f"SELECT id FROM {SCHEMA}.bots WHERE telegram_token = %s LIMIT 1", (token,))
            existing = cur.fetchone()
            if existing:
                db_bot_id = existing[0]
                cur.execute(
                    f"UPDATE {SCHEMA}.bots SET telegram_username = %s, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (tg_username, db_bot_id)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.bots (name, bot_type, platform, telegram_token, telegram_username, status) VALUES (%s, 'chatbot', 'telegram', %s, %s, 'active') RETURNING id",
                    (f'@{tg_username}', token, tg_username)
                )
                db_bot_id = cur.fetchone()[0]

        webhook_set = False
        my_url = os.environ.get('WEBHOOK_SELF_URL', '')
        if not my_url:
            params = {}
            request_context = {}
            my_url = ''

        if my_url:
            webhook_url = f'{my_url}?token={token}'
            try:
                payload = json.dumps({'url': webhook_url}).encode('utf-8')
                req = urllib.request.Request(
                    f'https://api.telegram.org/bot{token}/setWebhook',
                    data=payload,
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    wh_data = json.loads(resp.read().decode('utf-8'))
                if wh_data.get('ok'):
                    webhook_set = True
                    cur.execute(f"UPDATE {SCHEMA}.bots SET webhook_url = %s WHERE id = %s", (webhook_url, db_bot_id))
            except Exception:
                pass

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'ok': True,
                'bot_id': db_bot_id,
                'username': tg_username,
                'webhook_set': webhook_set
            })
        }
    finally:
        cur.close()
        conn.close()


def handle_webhook(event):
    """Обрабатывает входящее сообщение от Telegram"""
    try:
        update = json.loads(event.get('body', '{}'))
    except Exception:
        return OK_RESPONSE

    if 'message' not in update:
        return OK_RESPONSE

    message = update['message']
    chat_id = str(message['chat']['id'])
    message_text = message.get('text', '')
    user_id = message['from']['id']
    username = message['from'].get('username', '')

    if not message_text:
        return OK_RESPONSE

    params = event.get('queryStringParameters') or {}
    token_from_url = params.get('token', '')
    bot_token = token_from_url or os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return OK_RESPONSE

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            f"SELECT id, name, ai_model, ai_prompt FROM {SCHEMA}.bots WHERE telegram_token = %s AND status = 'active' LIMIT 1",
            (bot_token,)
        )
        bot = cur.fetchone()

        if not bot:
            cur.execute(
                f"SELECT id, name, ai_model, ai_prompt FROM {SCHEMA}.bots WHERE telegram_token = %s LIMIT 1",
                (bot_token,)
            )
            bot = cur.fetchone()

        if not bot:
            send_telegram_message(bot_token, chat_id, 'Бот ещё не настроен. Обратитесь к администратору.')
            return OK_RESPONSE

        bot_id = bot['id']
        ai_model = bot.get('ai_model') or ''
        ai_prompt = bot.get('ai_prompt') or ''

        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (bot_id, user_id, username, message_text) VALUES (%s, %s, %s, %s)",
                (bot_id, user_id, username, message_text)
            )
        except Exception:
            pass

        response_text = None

        # If bot has a real AI model set (not legacy 'groq' default), use OpenRouter
        if ai_model and ai_model != 'groq':
            kb_context = get_knowledge_response(bot_id, message_text, conn)
            response_text = call_openrouter(ai_model, message_text, ai_prompt, kb_context, bot_token)

        # Fallback chain: knowledge base -> ml-chat -> static fallback
        if not response_text:
            kb_response = get_knowledge_response(bot_id, message_text, conn)
            if kb_response:
                response_text = kb_response

        if not response_text:
            ml_chat_url = 'https://functions.poehali.dev/23f5dcaf-616d-4957-922d-ef9968ec1662'
            response_text = call_ml_chat(bot_id, message_text, ml_chat_url)

        if not response_text:
            response_text = get_fallback_response(message_text)

        send_telegram_message(bot_token, chat_id, response_text)

    finally:
        cur.close()
        conn.close()

    return OK_RESPONSE


def handler(event, context):
    """Telegram webhook: подключение бота (action=connect) и приём сообщений"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return OK_RESPONSE

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return OK_RESPONSE

    if body.get('action') in ('connect', 'disconnect'):
        return handle_connect(body)

    return handle_webhook(event)