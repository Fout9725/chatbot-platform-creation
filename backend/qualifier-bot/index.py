"""Telegram бот-квалификатор для предпринимателей. Задаёт 4 вопроса, подбирает решения по автоматизации и собирает заявки на консультацию."""

import json
import os
import logging
import psycopg2
import requests
from datetime import datetime

from config import (
    WELCOME_TEXT, EXAMPLES_TEXT,
    QUESTION_1_TEXT, QUESTION_1_OPTIONS,
    QUESTION_2_TEXT, QUESTION_2_OPTIONS,
    QUESTION_3_TEXT, QUESTION_3_OPTIONS,
    QUESTION_4_TEXT, QUESTION_4_OPTIONS,
    CONSULTATION_TEXT, ASK_NAME_TEXT, ASK_CONTACT_TEXT,
    ASK_FORMAT_TEXT, FORMAT_OPTIONS,
    ASK_TIME_TEXT, TIME_OPTIONS,
    LEAD_SENT_TEXT, CHANNEL_LINK,
    HELP_TEXT, ABOUT_TEXT, BUTTON_INCORRECT_TEXT,
    FREE_TEXT_RESPONSES, SOLUTIONS, CASES, OBJECTIONS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("QUALIFIER_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("QUALIFIER_ADMIN_CHAT_ID", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
DB_SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
VSEGPT_API_KEY = os.environ.get("VSEGPT_API_KEY", "")

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

STATES = {
    "start": "start",
    "q1": "question_1",
    "q1_custom": "question_1_custom",
    "q2": "question_2",
    "q3": "question_3",
    "q4": "question_4",
    "results": "results",
    "case": "case",
    "consultation_intro": "consultation_intro",
    "ask_name": "ask_name",
    "ask_contact": "ask_contact",
    "ask_format": "ask_format",
    "ask_time": "ask_time",
    "ask_time_custom": "ask_time_custom",
    "done": "done",
}


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def db_execute(query, params=None):
    conn = get_db()
    cur = conn.cursor()
    if params:
        full_query = query
        for p in params:
            if p is None:
                full_query = full_query.replace("%s", "NULL", 1)
            elif isinstance(p, (int, float)):
                full_query = full_query.replace("%s", str(p), 1)
            else:
                escaped = str(p).replace("'", "''")
                full_query = full_query.replace("%s", f"'{escaped}'", 1)
        cur.execute(full_query)
    else:
        cur.execute(query)
    try:
        rows = cur.fetchall()
    except Exception:
        rows = []
    cur.close()
    conn.close()
    return rows


def send_message(chat_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    resp = requests.post(f"{TELEGRAM_API}/sendMessage", json=payload, timeout=10)
    return resp.json()


def send_message_inline(chat_id, text, buttons):
    keyboard = []
    for btn in buttons:
        if isinstance(btn, dict):
            keyboard.append([btn])
        else:
            keyboard.append([{"text": btn, "callback_data": btn[:64]}])
    reply_markup = {"inline_keyboard": keyboard}
    return send_message(chat_id, text, reply_markup)


def send_message_contact_keyboard(chat_id, text):
    reply_markup = {
        "keyboard": [[{"text": "📱 Отправить контакт", "request_contact": True}]],
        "resize_keyboard": True,
        "one_time_keyboard": True,
    }
    return send_message(chat_id, text, reply_markup)


def remove_keyboard(chat_id, text):
    reply_markup = {"remove_keyboard": True}
    return send_message(chat_id, text, reply_markup)


def answer_callback(callback_query_id):
    requests.post(f"{TELEGRAM_API}/answerCallbackQuery", json={
        "callback_query_id": callback_query_id,
    }, timeout=5)


def get_or_create_user(user_id, username, first_name, utm_source=None):
    rows = db_execute(
        f"SELECT id, current_state FROM {DB_SCHEMA}.qualifier_users WHERE user_id = %s",
        [user_id],
    )
    if rows:
        db_execute(
            f"UPDATE {DB_SCHEMA}.qualifier_users SET last_active_at = NOW() WHERE user_id = %s",
            [user_id],
        )
        return rows[0][1]
    db_execute(
        f"INSERT INTO {DB_SCHEMA}.qualifier_users (user_id, username, first_name, utm_source) VALUES (%s, %s, %s, %s)",
        [user_id, username, first_name, utm_source],
    )
    return "start"


def set_state(user_id, state):
    db_execute(
        f"UPDATE {DB_SCHEMA}.qualifier_users SET current_state = %s, last_active_at = NOW() WHERE user_id = %s",
        [state, user_id],
    )


def get_state(user_id):
    rows = db_execute(
        f"SELECT current_state FROM {DB_SCHEMA}.qualifier_users WHERE user_id = %s",
        [user_id],
    )
    if rows:
        return rows[0][0]
    return "start"


def save_answer(user_id, field, value):
    rows = db_execute(
        f"SELECT id FROM {DB_SCHEMA}.qualifier_answers WHERE user_id = %s AND completed_at IS NULL",
        [user_id],
    )
    if not rows:
        db_execute(
            f"INSERT INTO {DB_SCHEMA}.qualifier_answers (user_id) VALUES (%s)",
            [user_id],
        )
    db_execute(
        f"UPDATE {DB_SCHEMA}.qualifier_answers SET {field} = %s WHERE user_id = %s AND completed_at IS NULL",
        [value, user_id],
    )


def complete_answers(user_id):
    db_execute(
        f"UPDATE {DB_SCHEMA}.qualifier_answers SET completed_at = NOW() WHERE user_id = %s AND completed_at IS NULL",
        [user_id],
    )


def get_answers(user_id):
    rows = db_execute(
        f"SELECT niche, pain, automation_level, sales_channel FROM {DB_SCHEMA}.qualifier_answers WHERE user_id = %s ORDER BY id DESC LIMIT 1",
        [user_id],
    )
    if rows:
        return {
            "niche": rows[0][0],
            "pain": rows[0][1],
            "automation_level": rows[0][2],
            "sales_channel": rows[0][3],
        }
    return {}


def save_lead(user_id, field, value):
    rows = db_execute(
        f"SELECT id FROM {DB_SCHEMA}.qualifier_leads WHERE user_id = %s AND status = 'new'",
        [user_id],
    )
    if not rows:
        db_execute(
            f"INSERT INTO {DB_SCHEMA}.qualifier_leads (user_id) VALUES (%s)",
            [user_id],
        )
    db_execute(
        f"UPDATE {DB_SCHEMA}.qualifier_leads SET {field} = %s WHERE user_id = %s AND status = 'new'",
        [value, user_id],
    )


def get_lead(user_id):
    rows = db_execute(
        f"SELECT contact_name, contact_phone, contact_telegram, preferred_format, preferred_time FROM {DB_SCHEMA}.qualifier_leads WHERE user_id = %s AND status = 'new' ORDER BY id DESC LIMIT 1",
        [user_id],
    )
    if rows:
        return {
            "contact_name": rows[0][0],
            "contact_phone": rows[0][1],
            "contact_telegram": rows[0][2],
            "preferred_format": rows[0][3],
            "preferred_time": rows[0][4],
        }
    return {}


def build_solutions_text(pain):
    data = SOLUTIONS.get(pain)
    if not data:
        return "Я подобрал для вас несколько решений. Давайте обсудим их на консультации!"

    text = f"✅ Понял вашу ситуацию\n\n{data['intro']}\n\nВот что можно автоматизировать в вашем случае:"

    for i, sol in enumerate(data["solutions"], 1):
        text += f"\n\n━━━━━━━━━━━━━━━━━━━━\n🤖 РЕШЕНИЕ {i}: {sol['title']}\n\n<b>Что делает:</b>\n{sol['description']}\n\n<b>Что это даёт:</b>\n{sol['benefit']}"

    text += "\n\n━━━━━━━━━━━━━━━━━━━━"
    return text


def get_case_for_niche(niche):
    if niche in CASES:
        return CASES[niche]
    return CASES["default"]


def generate_ai_solutions(answers):
    if not VSEGPT_API_KEY:
        return None

    niche = answers.get("niche", "не указано")
    pain = answers.get("pain", "не указано")
    automation = answers.get("automation_level", "не указано")
    channel = answers.get("sales_channel", "не указано")

    prompt = f"""Ты — эксперт по автоматизации бизнес-процессов с помощью чат-ботов и ИИ.

Пользователь прошёл диагностику:
- Ниша: {niche}
- Главная боль: {pain}
- Уровень автоматизации: {automation}
- Основной канал продаж: {channel}

Напиши короткое персонализированное дополнение к рекомендациям (2-3 предложения). 
Учти специфику ниши и канала продаж. Без технических терминов, простым языком.
Обращайся на "вы". Начни с конкретного совета."""

    try:
        resp = requests.post(
            "https://api.vsegpt.ru/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {VSEGPT_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek/deepseek-chat-3.1-alt-fast",
                "messages": [
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 500,
                "temperature": 0.7,
            },
            timeout=30,
        )
        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content.strip() if content else None
    except Exception as e:
        logger.error(f"AI error: {e}")
        return None


def send_admin_notification(user_id, username, answers, lead):
    if not ADMIN_CHAT_ID:
        return

    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    contact = lead.get("contact_phone") or lead.get("contact_telegram") or "не указан"

    text = f"""🔔 НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ

👤 Имя: {lead.get('contact_name', 'не указано')}
📱 Контакт: {contact}
🔗 Telegram ID: {user_id}
🔗 Username: @{username if username else 'нет'}

📊 ДАННЫЕ КВАЛИФИКАЦИИ:
Ниша: {answers.get('niche', 'не указано')}
Основная боль: {answers.get('pain', 'не указано')}
Уровень автоматизации: {answers.get('automation_level', 'не указано')}
Канал продаж: {answers.get('sales_channel', 'не указано')}

⚙️ ПРЕДПОЧТЕНИЯ ПО СВЯЗИ:
Формат: {lead.get('preferred_format', 'не указано')}
Время: {lead.get('preferred_time', 'не указано')}

🕐 Заявка создана: {now}"""

    buttons = {
        "inline_keyboard": [
            [{"text": "✍️ Написать клиенту", "url": f"tg://user?id={user_id}"}],
        ]
    }

    send_message(ADMIN_CHAT_ID, text, buttons)


def handle_start(chat_id, user_id, username, first_name, start_param=None):
    utm = start_param if start_param and start_param != "start" else None
    get_or_create_user(user_id, username, first_name, utm)
    set_state(user_id, STATES["start"])

    db_execute(
        f"DELETE FROM {DB_SCHEMA}.qualifier_answers WHERE user_id = %s AND completed_at IS NULL",
        [user_id],
    )

    send_message_inline(chat_id, WELCOME_TEXT, [
        "Поехали 🚀",
        "Примеры автоматизаций",
    ])
    set_state(user_id, STATES["q1"])


def handle_callback(chat_id, user_id, username, callback_data, callback_query_id):
    answer_callback(callback_query_id)
    state = get_state(user_id)

    if callback_data == "Поехали 🚀" or callback_data == "Да, пройти диагностику":
        db_execute(
            f"DELETE FROM {DB_SCHEMA}.qualifier_answers WHERE user_id = %s AND completed_at IS NULL",
            [user_id],
        )
        send_message_inline(chat_id, QUESTION_1_TEXT, QUESTION_1_OPTIONS)
        set_state(user_id, STATES["q1"])
        return

    if callback_data == "Примеры автоматизаций":
        send_message_inline(chat_id, EXAMPLES_TEXT, [
            "Да, пройти диагностику",
            "Сразу на консультацию",
        ])
        return

    if callback_data == "Сразу на консультацию":
        db_execute(
            f"DELETE FROM {DB_SCHEMA}.qualifier_answers WHERE user_id = %s AND completed_at IS NULL",
            [user_id],
        )
        db_execute(
            f"INSERT INTO {DB_SCHEMA}.qualifier_answers (user_id) VALUES (%s)",
            [user_id],
        )
        send_message(chat_id, CONSULTATION_TEXT)
        send_message(chat_id, ASK_NAME_TEXT)
        set_state(user_id, STATES["ask_name"])
        return

    if callback_data in QUESTION_1_OPTIONS:
        if callback_data == "Другое (напишите свой вариант)":
            send_message(chat_id, "Напишите вашу нишу в 1-2 словах:")
            set_state(user_id, STATES["q1_custom"])
            return
        save_answer(user_id, "niche", callback_data)
        send_message_inline(chat_id, QUESTION_2_TEXT, QUESTION_2_OPTIONS)
        set_state(user_id, STATES["q2"])
        return

    if callback_data in QUESTION_2_OPTIONS:
        save_answer(user_id, "pain", callback_data)
        send_message_inline(chat_id, QUESTION_3_TEXT, QUESTION_3_OPTIONS)
        set_state(user_id, STATES["q3"])
        return

    if callback_data in QUESTION_3_OPTIONS:
        save_answer(user_id, "automation_level", callback_data)
        send_message_inline(chat_id, QUESTION_4_TEXT, QUESTION_4_OPTIONS)
        set_state(user_id, STATES["q4"])
        return

    if callback_data in QUESTION_4_OPTIONS:
        save_answer(user_id, "sales_channel", callback_data)
        complete_answers(user_id)
        show_results(chat_id, user_id)
        return

    if callback_data == "Покажите пример из реального" or callback_data.startswith("Покажите пример"):
        answers = get_answers(user_id)
        niche = answers.get("niche", "")
        case_text = get_case_for_niche(niche)
        send_message_inline(chat_id, case_text, [
            "Хочу так же — обсудить на консультации",
        ])
        set_state(user_id, STATES["case"])
        return

    if callback_data.startswith("Хочу разобрать это") or callback_data.startswith("Хочу так же"):
        send_message(chat_id, CONSULTATION_TEXT)
        send_message(chat_id, ASK_NAME_TEXT)
        set_state(user_id, STATES["ask_name"])
        return

    if callback_data in FORMAT_OPTIONS:
        save_lead(user_id, "preferred_format", callback_data)
        send_message_inline(chat_id, ASK_TIME_TEXT, TIME_OPTIONS)
        set_state(user_id, STATES["ask_time"])
        return

    if callback_data in TIME_OPTIONS:
        if callback_data == "Напишу конкретное время":
            send_message(chat_id, "Напишите удобное время (по МСК):")
            set_state(user_id, STATES["ask_time_custom"])
            return
        save_lead(user_id, "preferred_time", callback_data)
        finalize_lead(chat_id, user_id, username)
        return

    if callback_data == "Перейти в канал":
        return

    if callback_data == "Вернуться в начало":
        first_name_rows = db_execute(
            f"SELECT first_name FROM {DB_SCHEMA}.qualifier_users WHERE user_id = %s",
            [user_id],
        )
        fn = first_name_rows[0][0] if first_name_rows else ""
        handle_start(chat_id, user_id, username, fn)
        return

    if callback_data == "Записаться на консультацию":
        send_message(chat_id, CONSULTATION_TEXT)
        send_message(chat_id, ASK_NAME_TEXT)
        set_state(user_id, STATES["ask_name"])
        return


def show_results(chat_id, user_id):
    answers = get_answers(user_id)
    pain = answers.get("pain", "")

    solutions_text = build_solutions_text(pain)
    send_message(chat_id, solutions_text)

    ai_addition = generate_ai_solutions(answers)
    if ai_addition:
        send_message(chat_id, f"💡 <b>Персональная рекомендация:</b>\n\n{ai_addition}")

    send_message_inline(chat_id, "Что дальше?", [
        {"text": "Покажите пример из реального бизнеса", "callback_data": "Покажите пример из реального"},
        {"text": "Хочу разобрать это на консультации", "callback_data": "Хочу разобрать это на консульт"},
    ])
    set_state(user_id, STATES["results"])


def finalize_lead(chat_id, user_id, username):
    answers = get_answers(user_id)
    lead = get_lead(user_id)

    send_admin_notification(user_id, username, answers, lead)

    final_text = LEAD_SENT_TEXT

    buttons = {
        "inline_keyboard": [
            [{"text": "Вернуться в начало", "callback_data": "Вернуться в начало"}],
        ]
    }

    if CHANNEL_LINK and CHANNEL_LINK != "https://t.me/your_channel":
        buttons["inline_keyboard"].insert(0, [{"text": "📢 Перейти в канал", "url": CHANNEL_LINK}])

    send_message(chat_id, final_text, buttons)
    set_state(user_id, STATES["done"])


def handle_text_message(chat_id, user_id, username, text):
    state = get_state(user_id)

    if state == STATES["q1_custom"]:
        save_answer(user_id, "niche", text.strip())
        send_message_inline(chat_id, QUESTION_2_TEXT, QUESTION_2_OPTIONS)
        set_state(user_id, STATES["q2"])
        return

    if state == STATES["ask_name"]:
        save_lead(user_id, "contact_name", text.strip())
        send_message_contact_keyboard(chat_id, ASK_CONTACT_TEXT)
        set_state(user_id, STATES["ask_contact"])
        return

    if state == STATES["ask_contact"]:
        contact = text.strip()
        if contact.startswith("@") or contact.startswith("+") or contact.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").isdigit():
            if contact.startswith("@"):
                save_lead(user_id, "contact_telegram", contact)
            else:
                save_lead(user_id, "contact_phone", contact)
            remove_keyboard(chat_id, "Принято!")
            send_message_inline(chat_id, ASK_FORMAT_TEXT, FORMAT_OPTIONS)
            set_state(user_id, STATES["ask_format"])
        else:
            save_lead(user_id, "contact_telegram", contact)
            remove_keyboard(chat_id, "Принято!")
            send_message_inline(chat_id, ASK_FORMAT_TEXT, FORMAT_OPTIONS)
            set_state(user_id, STATES["ask_format"])
        return

    if state == STATES["ask_time_custom"]:
        save_lead(user_id, "preferred_time", text.strip())
        finalize_lead(chat_id, user_id, username)
        return

    lower_text = text.lower().strip()
    for keyword, response in FREE_TEXT_RESPONSES.items():
        if keyword in lower_text:
            send_message_inline(chat_id, response, [
                "Записаться на консультацию",
            ])
            return

    for keyword, response in OBJECTIONS.items():
        if keyword in lower_text:
            send_message_inline(chat_id, response, [
                "Записаться на консультацию",
            ])
            return

    if state in [STATES["q1"], STATES["q2"], STATES["q3"], STATES["q4"]]:
        send_message(chat_id, BUTTON_INCORRECT_TEXT)
        return

    send_message_inline(chat_id, "Отличный вопрос! Давайте обсудим это на консультации, там смогу ответить подробнее.", [
        "Записаться на консультацию",
        "Вернуться в начало",
    ])


def handle_contact(chat_id, user_id, username, contact):
    state = get_state(user_id)
    if state == STATES["ask_contact"]:
        phone = contact.get("phone_number", "")
        if phone:
            save_lead(user_id, "contact_phone", phone)
        remove_keyboard(chat_id, "Принято!")
        send_message_inline(chat_id, ASK_FORMAT_TEXT, FORMAT_OPTIONS)
        set_state(user_id, STATES["ask_format"])


def handler(event, context):
    """Обработчик Telegram webhook для бота-квалификатора предпринимателей."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"status": "ok", "bot": "qualifier-bot"}),
        }

    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"status": "ok"}),
        }

    if not body:
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"status": "ok"}),
        }

    try:
        if "callback_query" in body:
            cq = body["callback_query"]
            chat_id = cq["message"]["chat"]["id"]
            user_id = cq["from"]["id"]
            username = cq["from"].get("username", "")
            callback_data = cq.get("data", "")
            callback_query_id = cq["id"]
            handle_callback(chat_id, user_id, username, callback_data, callback_query_id)

        elif "message" in body:
            msg = body["message"]
            chat_id = msg["chat"]["id"]
            user_id = msg["from"]["id"]
            username = msg["from"].get("username", "")
            first_name = msg["from"].get("first_name", "")

            if "contact" in msg:
                handle_contact(chat_id, user_id, username, msg["contact"])
            elif "text" in msg:
                text = msg["text"]

                if text == "/start" or text.startswith("/start "):
                    start_param = text.split(" ", 1)[1] if " " in text else None
                    handle_start(chat_id, user_id, username, first_name, start_param)
                elif text == "/restart":
                    handle_start(chat_id, user_id, username, first_name)
                elif text == "/help":
                    send_message(chat_id, HELP_TEXT)
                elif text == "/about":
                    send_message(chat_id, ABOUT_TEXT)
                else:
                    get_or_create_user(user_id, username, first_name)
                    handle_text_message(chat_id, user_id, username, text)

    except Exception as e:
        logger.error(f"Error processing update: {e}", exc_info=True)

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"status": "ok"}),
    }
