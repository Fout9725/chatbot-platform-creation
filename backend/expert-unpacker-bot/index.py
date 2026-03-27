import json
import os
import urllib.request
import urllib.parse
import psycopg2

BOT_TOKEN = os.environ.get('EXPERT_BOT_TOKEN', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
YOOKASSA_PAYMENT_URL = 'https://functions.poehali.dev/b41b8133-a3ad-4896-bda6-2b5ffa2bdeb3'
UNPACKING_PRICE = 990

QUESTIONS = {
    1: "Как вас зовут?",
    2: "В какой нише/сфере вы работаете? (психолог, коуч, маркетолог, нутрициолог и т.д.)",
    3: "Сколько лет опыта в этой сфере?",
    4: "Кто ваша целевая аудитория? (пол, возраст, род занятий)\nПример: \"Женщины 35-50, предприниматели и руководители\"",
    5: "Какие главные боли/проблемы вашей ЦА вы решаете?\nОпишите 3-5 основных болей",
    6: "Что ваши клиенты говорят о своих проблемах своими словами?\nНапишите фразы, которые вы слышите от них",
    7: "Какой результат получают ваши клиенты после работы с вами?\nОпишите конкретный, измеримый результат",
    8: "Какие услуги/продукты вы сейчас предлагаете?",
    9: "Какой у вас средний чек?",
    10: "Как вы сейчас привлекаете клиентов?\nУкажите каналы и способы",
    11: "Что вас отличает от других специалистов в вашей нише?\nВаш уникальный подход, метод, история",
    12: "Какие ваши самые яркие кейсы/истории успеха клиентов?\nОпишите 1-2 конкретных примера с результатами",
    13: "Какие у вас есть регалии, сертификаты, обучение?\nОпишите 3-5 ключевых, которые важны вашей ЦА",
    14: "Какова ваша главная бизнес-задача прямо сейчас?\nНапример: выйти на новую аудиторию, масштабироваться, упаковать продукт",
    15: "Есть ли у вас синдром самозванца или внутренние блоки?\nОпишите свои страхи и сомнения в продвижении",
    16: "Какой ваш любимый формат работы с клиентами?\nНапример: 1-2 месяца индивидуально, групповые программы, курсы",
    17: "Какую мечту/большую цель вы хотите реализовать в своём деле?\nОпишите, куда хотите прийти через 1-2 года"
}

WELCOME_MESSAGE = (
    "👋 Привет! Я — бот-распаковщик экспертности.\n\n"
    "Я задам вам 17 вопросов, которые помогут раскрыть вашу уникальность как эксперта. "
    "На основе ваших ответов ИИ сгенерирует персональную распаковку: позиционирование, "
    "ключевые смыслы и рекомендации по упаковке.\n\n"
    "📝 Отвечайте развёрнуто — чем подробнее ответы, тем точнее будет результат.\n"
    "Когда все вопросы будут пройдены — напишите /done для получения распаковки.\n\n"
    "Поехали! 🚀"
)

SYSTEM_PROMPT = """Ты — профессиональный продюсер и стратег по личному бренду. 
Тебе предоставлены ответы эксперта на 17 вопросов распаковки. 
На основе этих данных создай подробный анализ:

1. **Позиционирование** — кто этот эксперт, для кого и в чём его уникальность (3-5 предложений)
2. **Уникальное торговое предложение (УТП)** — сформулируй 2-3 варианта УТП
3. **Ключевые смыслы и ценности** — выдели 5-7 ключевых тем для контента
4. **Сильные стороны** — что выделяет эксперта на рынке
5. **Точки роста** — что стоит усилить или добавить
6. **Контент-стратегия** — какой контент создавать, какие форматы использовать (5-7 конкретных идей для постов/видео)
7. **Рекомендации по упаковке** — как оформить профиль, какие продукты запустить, какие каналы использовать

Пиши на русском языке. Будь конкретным, давай практические рекомендации. 
Используй эмодзи для структурирования. Ответ должен быть развёрнутым и полезным."""


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def send_message(chat_id, text, parse_mode=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"Error sending message: {e}")
        return None


def send_long_message(chat_id, text, parse_mode=None):
    max_len = 4000
    if len(text) <= max_len:
        return send_message(chat_id, text, parse_mode)
    parts = []
    while text:
        if len(text) <= max_len:
            parts.append(text)
            break
        split_pos = text.rfind('\n', 0, max_len)
        if split_pos == -1:
            split_pos = max_len
        parts.append(text[:split_pos])
        text = text[split_pos:].lstrip('\n')
    for part in parts:
        send_message(chat_id, part, parse_mode)


def send_message_with_buttons(chat_id, text, buttons, parse_mode='HTML'):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "reply_markup": json.dumps({"inline_keyboard": buttons})
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"Error sending message with buttons: {e}")
        return None


def create_payment_link(telegram_id, chat_id):
    payload = {
        "action": "create",
        "amount": UNPACKING_PRICE,
        "description": "Распаковка экспертности — AI-анализ",
        "return_url": f"https://t.me/ExpertUnpackerBot",
        "metadata": {
            "type": "expert_unpacker",
            "telegram_id": str(telegram_id),
            "chat_id": str(chat_id)
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        YOOKASSA_PAYMENT_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            body = json.loads(result.get('body', '{}')) if isinstance(result.get('body'), str) else result
            return body.get('confirmation_url')
    except Exception as e:
        print(f"Payment creation error: {e}")
        return None


def get_or_create_user(conn, telegram_id, username, first_name):
    cur = conn.cursor()
    cur.execute("SELECT id, question_step, status, payment_status FROM expert_users WHERE telegram_id = '%s'" % telegram_id.replace("'", "''"))
    row = cur.fetchone()
    if row:
        return {"id": row[0], "question_step": row[1], "status": row[2], "payment_status": row[3]}
    cur.execute(
        "INSERT INTO expert_users (telegram_id, username, first_name, question_step, status) VALUES ('%s', '%s', '%s', 0, 'new')"
        % (
            telegram_id.replace("'", "''"),
            (username or '').replace("'", "''"),
            (first_name or '').replace("'", "''")
        )
    )
    conn.commit()
    return {"id": None, "question_step": 0, "status": "new", "payment_status": "unpaid"}


def reset_user(conn, telegram_id, username, first_name):
    cur = conn.cursor()
    cur.execute("DELETE FROM expert_answers WHERE telegram_id = '%s'" % telegram_id.replace("'", "''"))
    cur.execute(
        "UPDATE expert_users SET question_step = 1, status = 'new', username = '%s', first_name = '%s', updated_at = NOW() WHERE telegram_id = '%s'"
        % (
            (username or '').replace("'", "''"),
            (first_name or '').replace("'", "''"),
            telegram_id.replace("'", "''")
        )
    )
    rows = cur.rowcount
    if rows == 0:
        cur.execute(
            "INSERT INTO expert_users (telegram_id, username, first_name, question_step, status) VALUES ('%s', '%s', '%s', 1, 'new')"
            % (
                telegram_id.replace("'", "''"),
                (username or '').replace("'", "''"),
                (first_name or '').replace("'", "''")
            )
        )
    conn.commit()


def save_answer(conn, telegram_id, question_number, question_text, answer):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO expert_answers (telegram_id, question_number, question_text, answer) VALUES ('%s', %d, '%s', '%s') ON CONFLICT (telegram_id, question_number) DO UPDATE SET answer = '%s', question_text = '%s'"
        % (
            telegram_id.replace("'", "''"),
            question_number,
            question_text.replace("'", "''"),
            answer.replace("'", "''"),
            answer.replace("'", "''"),
            question_text.replace("'", "''")
        )
    )
    conn.commit()


def update_step(conn, telegram_id, new_step):
    cur = conn.cursor()
    status = 'completed' if new_step > 17 else 'new'
    cur.execute(
        "UPDATE expert_users SET question_step = %d, status = '%s', updated_at = NOW() WHERE telegram_id = '%s'"
        % (new_step, status, telegram_id.replace("'", "''"))
    )
    conn.commit()


def get_all_answers(conn, telegram_id):
    cur = conn.cursor()
    cur.execute(
        "SELECT question_number, question_text, answer FROM expert_answers WHERE telegram_id = '%s' ORDER BY question_number"
        % telegram_id.replace("'", "''")
    )
    return cur.fetchall()


def mark_finished(conn, telegram_id):
    cur = conn.cursor()
    cur.execute(
        "UPDATE expert_users SET status = 'finished', question_step = 0, updated_at = NOW() WHERE telegram_id = '%s'"
        % telegram_id.replace("'", "''")
    )
    conn.commit()


def generate_unpacking(answers_text):
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Вот ответы эксперта на 17 вопросов распаковки:\n\n{answers_text}\n\nСоздай подробную распаковку экспертности."}
        ],
        "max_tokens": 4000,
        "temperature": 0.7
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"OpenRouter error: {e}")
        return None


def handle_start(conn, chat_id, telegram_id, username, first_name):
    reset_user(conn, telegram_id, username, first_name)
    send_message(chat_id, WELCOME_MESSAGE)
    send_message(chat_id, f"📌 Вопрос 1 из 17:\n\n{QUESTIONS[1]}")


def handle_done(conn, chat_id, telegram_id):
    answers = get_all_answers(conn, telegram_id)
    if len(answers) < 17:
        answered = len(answers)
        send_message(chat_id, f"⚠️ Вы ответили только на {answered} из 17 вопросов. Пожалуйста, завершите все вопросы перед получением распаковки.")
        return

    cur = conn.cursor()
    cur.execute("SELECT payment_status FROM expert_users WHERE telegram_id = '%s'" % telegram_id.replace("'", "''"))
    row = cur.fetchone()
    payment_status = row[0] if row else 'unpaid'

    if payment_status != 'paid':
        payment_url = create_payment_link(telegram_id, chat_id)
        if payment_url:
            send_message_with_buttons(
                chat_id,
                f"🎯 <b>Все 17 вопросов пройдены!</b>\n\n"
                f"Для получения персональной AI-распаковки экспертности необходимо оплатить услугу.\n\n"
                f"💰 <b>Стоимость: {UNPACKING_PRICE} ₽</b>\n\n"
                f"После оплаты напишите /done — и я мгновенно сгенерирую вашу распаковку.",
                [[{"text": f"💳 Оплатить {UNPACKING_PRICE} ₽", "url": payment_url}]]
            )
        else:
            send_message(chat_id, "❌ Ошибка создания платежа. Попробуйте ещё раз через минуту — напишите /done")
        return

    send_message(chat_id, "⏳ Генерирую вашу персональную распаковку экспертности... Это может занять 30-60 секунд.")

    answers_text = ""
    for q_num, q_text, answer in answers:
        answers_text += f"Вопрос {q_num}: {q_text}\nОтвет: {answer}\n\n"

    result = generate_unpacking(answers_text)
    if result:
        send_message(chat_id, "✅ Ваша распаковка экспертности готова!\n\n" + "=" * 30)
        send_long_message(chat_id, result)
        mark_finished(conn, telegram_id)
        send_message(chat_id, "\n🎉 Распаковка завершена! Чтобы пройти заново — напишите /start")
    else:
        send_message(chat_id, "❌ Произошла ошибка при генерации. Попробуйте ещё раз через минуту — напишите /done")


def handle_answer(conn, chat_id, telegram_id, text, current_step):
    if current_step < 1 or current_step > 17:
        send_message(chat_id, "Напишите /start чтобы начать распаковку экспертности.")
        return

    question_text = QUESTIONS[current_step]
    save_answer(conn, telegram_id, current_step, question_text, text)

    next_step = current_step + 1
    update_step(conn, telegram_id, next_step)

    if next_step <= 17:
        send_message(chat_id, f"✅ Ответ сохранён!\n\n📌 Вопрос {next_step} из 17:\n\n{QUESTIONS[next_step]}")
    else:
        send_message(
            chat_id,
            "🎯 Отлично! Все 17 вопросов пройдены!\n\n"
            "Напишите /done — и я подготовлю вашу персональную распаковку экспертности."
        )


def handler(event, context):
    """Бот-распаковщик эксперта — Telegram webhook обработчик"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') == 'GET':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({"status": "ok", "bot": "expert-unpacker"})
        }

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({"ok": True})}

    message = body.get('message')
    if not message:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({"ok": True})}

    chat_id = message['chat']['id']
    telegram_id = str(message['from']['id'])
    username = message['from'].get('username', '')
    first_name = message['from'].get('first_name', '')
    text = message.get('text', '').strip()

    if not text:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({"ok": True})}

    conn = get_db_connection()
    try:
        if text == '/done':
            user = get_or_create_user(conn, telegram_id, username, first_name)
            handle_done(conn, chat_id, telegram_id)
        elif text.startswith('/start'):
            handle_start(conn, chat_id, telegram_id, username, first_name)
        else:
            user = get_or_create_user(conn, telegram_id, username, first_name)
            current_step = user['question_step']
            if current_step == 0:
                send_message(chat_id, "👋 Напишите /start чтобы начать распаковку экспертности!")
            elif current_step > 17:
                send_message(chat_id, "✅ Вы уже ответили на все вопросы! Напишите /done для получения распаковки.")
            else:
                handle_answer(conn, chat_id, telegram_id, text, current_step)
    finally:
        conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({"ok": True})}