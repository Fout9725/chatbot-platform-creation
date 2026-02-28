"""Обработчик Telegram: подключение бота (connect) и приём сообщений"""

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


def call_openrouter(model_id, message_text, system_prompt, knowledge_context, bot_token_for_key):
    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        print('[OPENROUTER] No API key')
        return None

    try:
        system_content = system_prompt or 'Ты — полезный ассистент. Отвечай на русском языке.'
        if knowledge_context:
            system_content += f'\n\nИспользуй следующую информацию из базы знаний для ответа:\n{knowledge_context}\n\nОтвечай на основе этой информации. Если в базе знаний нет точного ответа, используй эту информацию как контекст и ответь максимально полезно.'

        messages = [
            {'role': 'system', 'content': system_content},
            {'role': 'user', 'content': message_text}
        ]

        payload = json.dumps({
            'model': model_id,
            'messages': messages,
            'max_tokens': 2000,
            'temperature': 0.7
        }).encode('utf-8')

        print(f'[OPENROUTER] Calling model={model_id}, msg={message_text[:80]}, kb={len(knowledge_context) if knowledge_context else 0} chars')

        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            choices = result.get('choices', [])
            if choices and choices[0].get('message', {}).get('content'):
                content = choices[0]['message']['content'].strip()
                print(f'[OPENROUTER] Got response: {len(content)} chars')
                return content
            print(f'[OPENROUTER] Empty choices. Response keys: {list(result.keys())}')
            err = result.get('error', {})
            if err:
                print(f'[OPENROUTER] API error: {err}')
        return None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')[:500] if e.fp else ''
        print(f'[OPENROUTER] HTTP {e.code}: {err_body}')
        return None
    except Exception as e:
        print(f'[OPENROUTER] Exception: {type(e).__name__}: {e}')
        return None


def get_knowledge_context(bot_id, message_text, conn):
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT content FROM {SCHEMA}.knowledge_sources WHERE bot_id = %s AND status = 'ready' AND content IS NOT NULL AND content != '' ORDER BY created_at DESC LIMIT 10",
            (bot_id,)
        )
        rows = cur.fetchall()
        cur.close()
        if not rows:
            print(f'[KB] No knowledge sources for bot_id={bot_id}')
            return None

        msg_lower = message_text.lower()
        msg_words = [w for w in msg_lower.split() if len(w) > 2]
        print(f'[KB] Found {len(rows)} sources, searching with words: {msg_words[:10]}')

        scored_chunks = []
        for row in rows:
            content = row[0]
            if not content:
                continue
            sentences = []
            for sep in ['\n\n', '\n', '. ']:
                if sep == '. ':
                    sentences = content.split(sep)
                else:
                    parts = content.split(sep)
                    for part in parts:
                        if len(part.strip()) > 20:
                            sentences.append(part.strip())
                if len(sentences) > 3:
                    break
            if not sentences:
                sentences = [content[i:i+500] for i in range(0, len(content), 400)]

            for chunk in sentences:
                chunk_lower = chunk.lower()
                if len(chunk.strip()) < 10:
                    continue
                score = 0
                for w in msg_words:
                    if w in chunk_lower:
                        score += 1
                if score > 0:
                    scored_chunks.append((score, chunk.strip()))

        scored_chunks.sort(key=lambda x: -x[0])
        top_chunks = scored_chunks[:5]

        if not top_chunks:
            all_content = '\n'.join([row[0][:2000] for row in rows if row[0]])
            if len(all_content) > 4000:
                all_content = all_content[:4000]
            print(f'[KB] No word matches, sending full context ({len(all_content)} chars)')
            return all_content

        result = '\n\n'.join([c[1][:800] for c in top_chunks])
        if len(result) > 4000:
            result = result[:4000]
        print(f'[KB] Found {len(top_chunks)} relevant chunks (best score={top_chunks[0][0]}), total {len(result)} chars')
        return result
    except Exception as e:
        print(f'[KB] Exception: {e}')
        return None


def get_all_knowledge(bot_id, conn):
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT content FROM {SCHEMA}.knowledge_sources WHERE bot_id = %s AND status = 'ready' AND content IS NOT NULL AND content != '' ORDER BY created_at DESC LIMIT 10",
            (bot_id,)
        )
        rows = cur.fetchall()
        cur.close()
        if not rows:
            return None
        all_content = '\n\n'.join([row[0][:3000] for row in rows if row[0]])
        if len(all_content) > 6000:
            all_content = all_content[:6000]
        return all_content
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
                    wh_result = json.loads(resp.read().decode('utf-8'))
                    webhook_set = wh_result.get('ok', False)

                if webhook_set:
                    cur.execute(
                        f"UPDATE {SCHEMA}.bots SET webhook_url = %s WHERE id = %s",
                        (webhook_url, db_bot_id)
                    )
            except Exception:
                pass

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'ok': True,
                'bot': {
                    'id': db_bot_id,
                    'username': tg_username,
                    'webhook_set': webhook_set
                }
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
            f"""SELECT b.id, b.name, b.ai_model, b.ai_prompt,
                       (SELECT COUNT(*) FROM {SCHEMA}.knowledge_sources ks WHERE ks.bot_id = b.id AND ks.status = 'ready') as kb_count
                FROM {SCHEMA}.bots b
                WHERE b.telegram_token = %s AND b.status = 'active'
                ORDER BY kb_count DESC, b.updated_at DESC
                LIMIT 1""",
            (bot_token,)
        )
        bot = cur.fetchone()

        if not bot:
            cur.execute(
                f"SELECT id, name, ai_model, ai_prompt FROM {SCHEMA}.bots WHERE telegram_token = %s ORDER BY updated_at DESC LIMIT 1",
                (bot_token,)
            )
            bot = cur.fetchone()

        if not bot:
            send_telegram_message(bot_token, chat_id, 'Бот ещё не настроен. Обратитесь к администратору.')
            return OK_RESPONSE

        bot_id = bot['id']
        ai_model = bot.get('ai_model') or ''
        ai_prompt = bot.get('ai_prompt') or ''

        print(f'[WEBHOOK] bot_id={bot_id}, model={ai_model}, msg={message_text[:50]}')

        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (bot_id, user_id, username, message_text) VALUES (%s, %s, %s, %s)",
                (bot_id, user_id, username, message_text)
            )
        except Exception:
            pass

        response_text = None
        FALLBACK_MODELS = ['openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat-v3-0324:free']

        kb_context = None
        if ai_model and ai_model != 'groq':
            kb_context = get_knowledge_context(bot_id, message_text, conn)
            if not kb_context:
                kb_context = get_all_knowledge(bot_id, conn)
            response_text = call_openrouter(ai_model, message_text, ai_prompt, kb_context, bot_token)

        if not response_text:
            if not kb_context:
                kb_context = get_all_knowledge(bot_id, conn)
            for fallback_model in FALLBACK_MODELS:
                if fallback_model == ai_model:
                    continue
                print(f'[WEBHOOK] Trying fallback model: {fallback_model}')
                response_text = call_openrouter(fallback_model, message_text, ai_prompt, kb_context, bot_token)
                if response_text:
                    break

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