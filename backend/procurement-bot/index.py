"""Telegram-бот менеджера по закупкам — интерактивное управление тендерами через чат."""

import json
import os
import logging
import requests
import psycopg2
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("PROCUREMENT_BOT_TOKEN", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
LLM_MODEL = "google/gemini-2.0-flash-exp:free"
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

STATES = {
    "idle": "idle",
    "create_title": "create_title",
    "create_desc": "create_desc",
    "create_specs": "create_specs",
    "create_budget": "create_budget",
    "create_deadline": "create_deadline",
    "tender_menu": "tender_menu",
    "add_supplier_name": "add_supplier_name",
    "add_supplier_email": "add_supplier_email",
    "supplier_question": "supplier_question",
    "clarification": "clarification",
}


def handler(event, context):
    """Обработчик Telegram webhook для бота менеджера по закупкам."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    if event.get("httpMethod") == "GET":
        qs = event.get("queryStringParameters") or {}
        if qs.get("action") == "set_webhook":
            return setup_webhook(qs.get("url", ""))
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"status": "ok", "bot": "procurement-bot"}),
        }

    body = event.get("body", "")
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return {"statusCode": 200, "body": "ok"}

    if not body:
        return {"statusCode": 200, "body": "ok"}

    try:
        process_update(body)
    except Exception as e:
        logger.error(f"Error processing update: {e}", exc_info=True)

    return {"statusCode": 200, "body": "ok"}


def process_update(update):
    if "callback_query" in update:
        cb = update["callback_query"]
        chat_id = cb["message"]["chat"]["id"]
        user_id = str(cb["from"]["id"])
        username = cb["from"].get("username", "")
        data = cb.get("data", "")
        callback_query_id = cb["id"]
        answer_callback(callback_query_id)
        handle_callback(chat_id, user_id, username, data)
        return

    msg = update.get("message")
    if not msg:
        return

    chat_id = msg["chat"]["id"]
    user_id = str(msg["from"]["id"])
    username = msg["from"].get("username", "")
    first_name = msg["from"].get("first_name", "")
    text = msg.get("text", "")

    if text.startswith("/start"):
        handle_start(chat_id, user_id, first_name)
        return

    if text == "/help":
        handle_help(chat_id)
        return

    if text == "/mytenders":
        show_tenders_list(chat_id, user_id)
        return

    if text == "/newtender":
        start_create_tender(chat_id, user_id)
        return

    handle_text(chat_id, user_id, username, text)


# ==================== TELEGRAM HELPERS ====================

def send_message(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    try:
        resp = requests.post(f"{TELEGRAM_API}/sendMessage", json=payload, timeout=10)
        return resp.json()
    except Exception as e:
        logger.error(f"send_message error: {e}")
        return {}


def send_inline(chat_id, text, buttons):
    keyboard = []
    for btn in buttons:
        if isinstance(btn, list):
            keyboard.append(btn)
        elif isinstance(btn, dict):
            keyboard.append([btn])
        else:
            keyboard.append([{"text": btn, "callback_data": btn[:64]}])
    return send_message(chat_id, text, {"inline_keyboard": keyboard})


def answer_callback(callback_query_id):
    try:
        requests.post(f"{TELEGRAM_API}/answerCallbackQuery", json={"callback_query_id": callback_query_id}, timeout=5)
    except Exception:
        pass


def send_typing(chat_id):
    try:
        requests.post(f"{TELEGRAM_API}/sendChatAction", json={"chat_id": chat_id, "action": "typing"}, timeout=5)
    except Exception:
        pass


# ==================== DATABASE ====================

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def db_execute(query, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(query, params or [])
        try:
            return cur.fetchall()
        except Exception:
            return []
    finally:
        conn.close()


def db_execute_one(query, params=None):
    rows = db_execute(query, params)
    return rows[0] if rows else None


def get_state(user_id):
    row = db_execute_one(
        f"SELECT state FROM {SCHEMA}.procurement_bot_states WHERE user_id = %s", [user_id]
    )
    return row[0] if row else "idle"


def set_state(user_id, state, data=None):
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_bot_states (user_id, state, state_data, updated_at) "
        f"VALUES (%s, %s, %s, NOW()) "
        f"ON CONFLICT (user_id) DO UPDATE SET state = %s, state_data = %s, updated_at = NOW()",
        [user_id, state, json.dumps(data or {}), state, json.dumps(data or {})]
    )


def get_state_data(user_id):
    row = db_execute_one(
        f"SELECT state_data FROM {SCHEMA}.procurement_bot_states WHERE user_id = %s", [user_id]
    )
    if row and row[0]:
        if isinstance(row[0], str):
            return json.loads(row[0])
        return row[0]
    return {}


# ==================== LLM ====================

def call_llm(system_prompt, user_prompt, temperature=0.7):
    import urllib.request
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "max_tokens": 4000
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers=headers)
    resp = urllib.request.urlopen(req, timeout=60)
    result = json.loads(resp.read().decode("utf-8"))
    return result["choices"][0]["message"]["content"]


# ==================== HANDLERS ====================

def handle_start(chat_id, user_id, first_name):
    set_state(user_id, "idle")
    text = (
        f"👋 Привет, {first_name}!\n\n"
        f"Я — <b>AI менеджер по закупкам</b>. Помогу вам:\n\n"
        f"📋 Создать тендер и описать требования\n"
        f"🔍 Найти поставщиков с помощью AI\n"
        f"📨 Сформировать и отправить запросы предложений\n"
        f"📊 Проанализировать и сравнить предложения\n"
        f"✅ Выбрать лучшего поставщика\n\n"
        f"Начнём?"
    )
    send_inline(chat_id, text, [
        [{"text": "📋 Создать тендер", "callback_data": "new_tender"}],
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
        [{"text": "ℹ️ Помощь", "callback_data": "help"}],
    ])


def handle_help(chat_id):
    text = (
        "📖 <b>Команды бота:</b>\n\n"
        "/start — Начало работы\n"
        "/newtender — Создать тендер\n"
        "/mytenders — Мои тендеры\n"
        "/help — Помощь\n\n"
        "<b>Как пользоваться:</b>\n"
        "1. Создайте тендер — опишите что закупаете\n"
        "2. AI найдёт подходящих поставщиков\n"
        "3. Бот сформирует запросы предложений (RFQ)\n"
        "4. AI проанализирует ответы и выберет лучших\n"
    )
    send_message(chat_id, text)


def start_create_tender(chat_id, user_id):
    set_state(user_id, "create_title")
    send_message(chat_id, "📋 <b>Создание тендера</b>\n\nВведите название закупки:\n\n<i>Например: Закупка офисной мебели, Поставка серверного оборудования</i>")


def handle_text(chat_id, user_id, username, text):
    state = get_state(user_id)
    data = get_state_data(user_id)

    if state == "create_title":
        data["title"] = text.strip()
        set_state(user_id, "create_desc", data)
        send_message(chat_id, "📝 Опишите подробнее, что нужно закупить:\n\n<i>Чем подробнее — тем лучше AI подберёт поставщиков</i>")
        return

    if state == "create_desc":
        data["description"] = text.strip()
        set_state(user_id, "create_specs", data)
        send_message(chat_id, "📐 Укажите технические требования / спецификации:\n\n<i>Или напишите «—» если их нет</i>")
        return

    if state == "create_specs":
        specs = text.strip()
        data["specifications"] = "" if specs in ("—", "-", "нет") else specs
        set_state(user_id, "create_budget", data)
        send_message(chat_id, "💰 Укажите максимальный бюджет (число в рублях):\n\n<i>Или напишите «—» если бюджет не ограничен</i>")
        return

    if state == "create_budget":
        budget_text = text.strip()
        if budget_text in ("—", "-", "нет", "без ограничений"):
            data["budget_max"] = None
        else:
            clean = budget_text.replace(" ", "").replace("₽", "").replace("руб", "").replace("р", "")
            try:
                data["budget_max"] = float(clean)
            except ValueError:
                data["budget_max"] = None
        set_state(user_id, "create_deadline", data)
        send_inline(chat_id, "📅 Срок приёма предложений:", [
            [{"text": "7 дней", "callback_data": "deadline_7"}],
            [{"text": "14 дней", "callback_data": "deadline_14"}],
            [{"text": "30 дней", "callback_data": "deadline_30"}],
        ])
        return

    if state == "add_supplier_name":
        data["supplier_name"] = text.strip()
        set_state(user_id, "add_supplier_email", data)
        send_message(chat_id, "📧 Email поставщика:\n\n<i>Или «—» если нет</i>")
        return

    if state == "add_supplier_email":
        email = text.strip()
        tender_id = data.get("tender_id")
        company_name = data.get("supplier_name", "")
        email_val = "" if email in ("—", "-", "нет") else email

        db_execute(
            f"INSERT INTO {SCHEMA}.procurement_suppliers "
            f"(tender_id, company_name, email, website, status, created_at) "
            f"VALUES (%s, %s, %s, '', 'new', NOW())",
            [int(tender_id), company_name, email_val]
        )
        set_state(user_id, "tender_menu", {"tender_id": tender_id})
        send_message(chat_id, f"✅ Поставщик <b>{company_name}</b> добавлен!")
        show_tender_menu(chat_id, user_id, tender_id)
        return

    if state == "supplier_question":
        tender_id = data.get("tender_id")
        handle_supplier_question_text(chat_id, user_id, tender_id, text.strip())
        return

    if state == "clarification":
        tender_id = data.get("tender_id")
        supplier_id = data.get("supplier_id")
        handle_clarification_text(chat_id, user_id, tender_id, supplier_id, text.strip())
        return

    send_inline(chat_id, "Не понял команду. Выберите действие:", [
        [{"text": "📋 Создать тендер", "callback_data": "new_tender"}],
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
    ])


def handle_callback(chat_id, user_id, username, data):
    if data == "new_tender":
        start_create_tender(chat_id, user_id)
        return

    if data == "my_tenders":
        show_tenders_list(chat_id, user_id)
        return

    if data == "help":
        handle_help(chat_id)
        return

    if data == "go_start":
        handle_start(chat_id, user_id, "")
        return

    if data.startswith("deadline_"):
        days = int(data.split("_")[1])
        state_data = get_state_data(user_id)
        create_tender(chat_id, user_id, state_data, days)
        return

    if data.startswith("tender_"):
        tender_id = data.split("_")[1]
        set_state(user_id, "tender_menu", {"tender_id": tender_id})
        show_tender_menu(chat_id, user_id, tender_id)
        return

    if data.startswith("search_sup_"):
        tender_id = data.split("_")[2]
        send_typing(chat_id)
        search_suppliers_ai(chat_id, user_id, tender_id)
        return

    if data.startswith("add_sup_"):
        tender_id = data.split("_")[2]
        set_state(user_id, "add_supplier_name", {"tender_id": tender_id})
        send_message(chat_id, "🏢 Введите название компании-поставщика:")
        return

    if data.startswith("send_rfq_"):
        tender_id = data.split("_")[2]
        send_typing(chat_id)
        send_rfq(chat_id, user_id, tender_id)
        return

    if data.startswith("sim_resp_"):
        tender_id = data.split("_")[2]
        send_typing(chat_id)
        simulate_responses(chat_id, user_id, tender_id)
        return

    if data.startswith("analyze_"):
        tender_id = data.split("_")[1]
        send_typing(chat_id)
        analyze_proposals(chat_id, user_id, tender_id)
        return

    if data.startswith("approve_"):
        parts = data.split("_")
        tender_id = parts[1]
        supplier_id = parts[2]
        send_typing(chat_id)
        approve_supplier(chat_id, user_id, tender_id, supplier_id)
        return

    if data.startswith("reject_all_"):
        tender_id = data.split("_")[2]
        reject_all(chat_id, user_id, tender_id)
        return

    if data.startswith("suppliers_"):
        tender_id = data.split("_")[1]
        show_suppliers(chat_id, user_id, tender_id)
        return

    if data.startswith("proposals_"):
        tender_id = data.split("_")[1]
        show_proposals(chat_id, user_id, tender_id)
        return

    if data.startswith("cancel_"):
        tender_id = data.split("_")[1]
        cancel_tender(chat_id, user_id, tender_id)
        return


# ==================== TENDER OPERATIONS ====================

def create_tender(chat_id, user_id, data, deadline_days):
    title = data.get("title", "Без названия")
    description = data.get("description", "")
    specifications = data.get("specifications", "")
    budget_max = data.get("budget_max")
    deadline = datetime.now() + timedelta(days=deadline_days)

    row = db_execute_one(
        f"INSERT INTO {SCHEMA}.procurement_tenders "
        f"(owner_id, title, description, specifications, criteria, budget_max, "
        f"min_suppliers, response_deadline, status, created_at, updated_at) "
        f"VALUES (%s, %s, %s, %s, '', %s, 3, %s, 'draft', NOW(), NOW()) RETURNING id",
        [user_id, title, description, specifications, budget_max, deadline]
    )
    tender_id = row[0]

    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, created_at) "
        f"VALUES (%s, 'create_tender', %s, NOW())",
        [tender_id, f'Тендер "{title}" создан через Telegram']
    )

    set_state(user_id, "tender_menu", {"tender_id": str(tender_id)})

    budget_str = f"{int(budget_max):,} ₽".replace(",", " ") if budget_max else "не ограничен"
    text = (
        f"✅ <b>Тендер создан!</b>\n\n"
        f"📋 {title}\n"
        f"💰 Бюджет: {budget_str}\n"
        f"📅 Дедлайн: {deadline.strftime('%d.%m.%Y')}\n\n"
        f"Что дальше?"
    )
    send_inline(chat_id, text, [
        [{"text": "🔍 AI найдёт поставщиков", "callback_data": f"search_sup_{tender_id}"}],
        [{"text": "➕ Добавить поставщика вручную", "callback_data": f"add_sup_{tender_id}"}],
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
    ])


def show_tenders_list(chat_id, user_id):
    rows = db_execute(
        f"SELECT id, title, status, budget_max, created_at "
        f"FROM {SCHEMA}.procurement_tenders WHERE owner_id = %s ORDER BY created_at DESC LIMIT 10",
        [user_id]
    )

    if not rows:
        send_inline(chat_id, "📂 У вас пока нет тендеров.", [
            [{"text": "📋 Создать тендер", "callback_data": "new_tender"}],
        ])
        return

    status_icons = {
        "draft": "📝", "active": "🟢", "evaluating": "🔍",
        "awarded": "🏆", "cancelled": "❌", "completed": "✅"
    }

    text = "📂 <b>Ваши тендеры:</b>\n\n"
    buttons = []
    for tid, title, status, budget, created in rows:
        icon = status_icons.get(status, "📋")
        text += f"{icon} <b>{title}</b>\n   Статус: {status}\n\n"
        buttons.append([{"text": f"{icon} {title[:40]}", "callback_data": f"tender_{tid}"}])

    buttons.append([{"text": "📋 Создать новый", "callback_data": "new_tender"}])
    send_inline(chat_id, text, buttons)


def show_tender_menu(chat_id, user_id, tender_id):
    row = db_execute_one(
        f"SELECT id, title, status, budget_max, response_deadline "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    tid, title, status, budget, deadline = row

    sup_count = db_execute_one(
        f"SELECT COUNT(*) FROM {SCHEMA}.procurement_suppliers WHERE tender_id = %s",
        [int(tender_id)]
    )
    sup_num = sup_count[0] if sup_count else 0

    prop_count = db_execute_one(
        f"SELECT COUNT(*) FROM {SCHEMA}.procurement_proposals WHERE tender_id = %s",
        [int(tender_id)]
    )
    prop_num = prop_count[0] if prop_count else 0

    status_icons = {
        "draft": "📝", "active": "🟢", "evaluating": "🔍",
        "awarded": "🏆", "cancelled": "❌", "completed": "✅"
    }
    icon = status_icons.get(status, "📋")
    budget_str = f"{int(budget):,} ₽".replace(",", " ") if budget else "—"
    deadline_str = deadline.strftime("%d.%m.%Y") if deadline else "—"

    text = (
        f"{icon} <b>{title}</b>\n\n"
        f"Статус: {status}\n"
        f"💰 Бюджет: {budget_str}\n"
        f"📅 Дедлайн: {deadline_str}\n"
        f"🏢 Поставщиков: {sup_num}\n"
        f"📨 Предложений: {prop_num}\n"
    )

    buttons = []

    if status == "draft":
        buttons.append([{"text": "🔍 AI найдёт поставщиков", "callback_data": f"search_sup_{tid}"}])
        buttons.append([{"text": "➕ Добавить поставщика", "callback_data": f"add_sup_{tid}"}])
        if sup_num > 0:
            buttons.append([{"text": "📨 Отправить RFQ", "callback_data": f"send_rfq_{tid}"}])
        buttons.append([{"text": "❌ Отменить тендер", "callback_data": f"cancel_{tid}"}])

    elif status == "active":
        buttons.append([{"text": "📨 Симулировать ответы (MVP)", "callback_data": f"sim_resp_{tid}"}])
        buttons.append([{"text": "🏢 Поставщики", "callback_data": f"suppliers_{tid}"}])
        buttons.append([{"text": "❌ Отменить тендер", "callback_data": f"cancel_{tid}"}])

    elif status == "evaluating":
        buttons.append([{"text": "📊 Анализ предложений", "callback_data": f"analyze_{tid}"}])
        buttons.append([{"text": "📋 Предложения", "callback_data": f"proposals_{tid}"}])

    elif status == "awarded":
        buttons.append([{"text": "📋 Результаты", "callback_data": f"proposals_{tid}"}])

    if sup_num > 0:
        buttons.append([{"text": "🏢 Список поставщиков", "callback_data": f"suppliers_{tid}"}])

    buttons.append([{"text": "◀️ Назад к тендерам", "callback_data": "my_tenders"}])

    send_inline(chat_id, text, buttons)


def show_suppliers(chat_id, user_id, tender_id):
    rows = db_execute(
        f"SELECT id, company_name, email, status FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s ORDER BY created_at",
        [int(tender_id)]
    )
    if not rows:
        send_inline(chat_id, "🏢 Поставщиков пока нет.", [
            [{"text": "🔍 AI найдёт", "callback_data": f"search_sup_{tender_id}"}],
            [{"text": "◀️ Назад", "callback_data": f"tender_{tender_id}"}],
        ])
        return

    status_map = {"new": "🆕", "found": "🔍", "contacted": "📨", "responded": "✅", "rejected": "❌", "awarded": "🏆"}
    text = "🏢 <b>Поставщики:</b>\n\n"
    for sid, name, email, st in rows:
        si = status_map.get(st, "•")
        text += f"{si} <b>{name}</b>\n   {email or '—'} | {st}\n\n"

    send_inline(chat_id, text, [
        [{"text": "➕ Добавить ещё", "callback_data": f"add_sup_{tender_id}"}],
        [{"text": "◀️ Назад", "callback_data": f"tender_{tender_id}"}],
    ])


def show_proposals(chat_id, user_id, tender_id):
    rows = db_execute(
        f"SELECT p.id, s.company_name, p.price, p.delivery_days, p.warranty_months, p.score "
        f"FROM {SCHEMA}.procurement_proposals p "
        f"JOIN {SCHEMA}.procurement_suppliers s ON s.id = p.supplier_id "
        f"WHERE p.tender_id = %s ORDER BY p.score DESC NULLS LAST",
        [int(tender_id)]
    )
    if not rows:
        send_inline(chat_id, "📋 Предложений пока нет.", [
            [{"text": "◀️ Назад", "callback_data": f"tender_{tender_id}"}],
        ])
        return

    text = "📋 <b>Предложения:</b>\n\n"
    buttons = []
    for i, (pid, name, price, delivery, warranty, score) in enumerate(rows, 1):
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
        price_str = f"{int(price):,}₽".replace(",", " ") if price else "—"
        score_str = f"⭐{score}" if score else ""
        text += f"{medal} <b>{name}</b>\n   💰 {price_str} | 📦 {delivery}дн | 🛡 {warranty}мес {score_str}\n\n"

    row = db_execute_one(
        f"SELECT status FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    status = row[0] if row else ""

    if status == "evaluating":
        for pid, name, price, delivery, warranty, score in rows[:3]:
            sup_row = db_execute_one(
                f"SELECT supplier_id FROM {SCHEMA}.procurement_proposals WHERE id = %s", [pid]
            )
            if sup_row:
                buttons.append([{"text": f"✅ Выбрать {name[:30]}", "callback_data": f"approve_{tender_id}_{sup_row[0]}"}])
        buttons.append([{"text": "❌ Отклонить всех", "callback_data": f"reject_all_{tender_id}"}])

    buttons.append([{"text": "◀️ Назад", "callback_data": f"tender_{tender_id}"}])
    send_inline(chat_id, text, buttons)


# ==================== AI OPERATIONS ====================

def search_suppliers_ai(chat_id, user_id, tender_id):
    row = db_execute_one(
        f"SELECT title, description, specifications, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    title, description, specifications, budget_max = row
    send_message(chat_id, "🔍 AI ищет поставщиков... Это займёт несколько секунд.")

    system_prompt = (
        "Ты — AI-ассистент по закупкам. Предложи список потенциальных поставщиков. "
        "Сгенерируй реалистичных поставщиков с названиями, email и сайтами. "
        'Ответ строго в JSON: {"suppliers": [{"company_name": "...", "email": "...", "website": "...", "reason": "..."}]} '
        "Предложи 5-7 поставщиков."
    )
    user_prompt = f"Тендер: {title}\nОписание: {description}\nСпецификации: {specifications}\nБюджет: {budget_max}"

    try:
        ai_text = call_llm(system_prompt, user_prompt, temperature=0.8)
        ai_clean = ai_text.strip()
        if "```json" in ai_clean:
            ai_clean = ai_clean.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_clean:
            ai_clean = ai_clean.split("```")[1].split("```")[0].strip()

        ai_data = json.loads(ai_clean)
        suppliers = ai_data.get("suppliers", [])

        added = []
        for s in suppliers:
            name = s.get("company_name", "").strip()
            if not name:
                continue
            db_execute(
                f"INSERT INTO {SCHEMA}.procurement_suppliers "
                f"(tender_id, company_name, email, website, status, created_at) "
                f"VALUES (%s, %s, %s, %s, 'found', NOW())",
                [int(tender_id), name, s.get("email", ""), s.get("website", "")]
            )
            added.append(f"• {name}")

        db_execute(
            f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, ai_reasoning, created_at) "
            f"VALUES (%s, 'search_suppliers', %s, %s, NOW())",
            [int(tender_id), f"AI нашёл {len(added)} поставщиков", ai_text[:2000]]
        )

        text = f"✅ AI нашёл <b>{len(added)}</b> поставщиков:\n\n" + "\n".join(added)
        send_inline(chat_id, text, [
            [{"text": "📨 Отправить RFQ всем", "callback_data": f"send_rfq_{tender_id}"}],
            [{"text": "➕ Добавить вручную", "callback_data": f"add_sup_{tender_id}"}],
            [{"text": "◀️ К тендеру", "callback_data": f"tender_{tender_id}"}],
        ])
    except Exception as e:
        logger.error(f"search_suppliers error: {e}", exc_info=True)
        send_inline(chat_id, f"❌ Ошибка поиска поставщиков: {str(e)[:200]}", [
            [{"text": "🔄 Попробовать снова", "callback_data": f"search_sup_{tender_id}"}],
            [{"text": "◀️ К тендеру", "callback_data": f"tender_{tender_id}"}],
        ])


def send_rfq(chat_id, user_id, tender_id):
    row = db_execute_one(
        f"SELECT title, description, specifications, criteria, budget_max, response_deadline "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    title, description, specifications, criteria, budget_max, deadline = row

    suppliers = db_execute(
        f"SELECT id, company_name, email FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND status IN ('new', 'found')",
        [int(tender_id)]
    )
    if not suppliers:
        send_message(chat_id, "❌ Нет поставщиков для отправки RFQ")
        return

    send_message(chat_id, f"📨 Генерирую RFQ для {len(suppliers)} поставщиков...")

    system_prompt = (
        "Ты — менеджер по закупкам. Составь деловое письмо-запрос предложений (RFQ). "
        "Формат: Тема: ... (первая строка), затем текст письма. Пиши на русском."
    )

    sent = []
    for sup_id, company_name, email in suppliers:
        deadline_str = deadline.strftime("%d.%m.%Y") if deadline else "—"
        user_prompt = (
            f"Компания: {company_name}\nТендер: {title}\nОписание: {description}\n"
            f"Спецификации: {specifications}\nБюджет: {budget_max}\nДедлайн: {deadline_str}"
        )
        try:
            ai_text = call_llm(system_prompt, user_prompt, temperature=0.5)
            lines = ai_text.strip().split("\n")
            subject = title
            body_text = ai_text
            for i, line in enumerate(lines):
                if line.lower().startswith("тема:"):
                    subject = line.split(":", 1)[1].strip()
                    body_text = "\n".join(lines[i+1:]).strip()
                    break

            db_execute(
                f"INSERT INTO {SCHEMA}.procurement_messages "
                f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
                f"VALUES (%s, %s, 'outgoing', 'rfq', %s, %s, NOW())",
                [int(tender_id), sup_id, subject, body_text]
            )
            db_execute(
                f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'contacted' WHERE id = %s",
                [sup_id]
            )
            sent.append(company_name)
        except Exception as e:
            logger.error(f"RFQ error for {company_name}: {e}")

    db_execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = 'active', updated_at = NOW() WHERE id = %s",
        [int(tender_id)]
    )
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, created_at) "
        f"VALUES (%s, 'send_rfq', %s, NOW())",
        [int(tender_id), f"RFQ отправлен {len(sent)} поставщикам"]
    )

    text = f"✅ RFQ отправлен <b>{len(sent)}</b> поставщикам:\n\n" + "\n".join(f"• {n}" for n in sent)
    send_inline(chat_id, text, [
        [{"text": "📨 Симулировать ответы (MVP)", "callback_data": f"sim_resp_{tender_id}"}],
        [{"text": "◀️ К тендеру", "callback_data": f"tender_{tender_id}"}],
    ])


def simulate_responses(chat_id, user_id, tender_id):
    row = db_execute_one(
        f"SELECT title, description, specifications, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    title, description, specifications, budget_max = row

    suppliers = db_execute(
        f"SELECT id, company_name FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND status = 'contacted'",
        [int(tender_id)]
    )
    if not suppliers:
        send_message(chat_id, "❌ Нет поставщиков со статусом 'contacted'")
        return

    send_message(chat_id, f"🤖 AI генерирует ответы от {len(suppliers)} поставщиков...")

    supplier_names = ", ".join(name for _, name in suppliers)
    system_prompt = (
        "Симулируй ответы поставщиков на тендер. Каждый ответ должен содержать цену, "
        "сроки поставки и гарантию. Ответы должны быть реалистичными и разными. "
        'JSON: {"responses": [{"company_name": "...", "price": число, "currency": "RUB", '
        '"delivery_days": число, "warranty_months": число, "proposal_text": "..."}]}'
    )
    user_prompt = (
        f"Тендер: {title}\nОписание: {description}\nСпецификации: {specifications}\n"
        f"Бюджет: {budget_max}\nПоставщики: {supplier_names}"
    )

    try:
        ai_text = call_llm(system_prompt, user_prompt, temperature=0.8)
        ai_clean = ai_text.strip()
        if "```json" in ai_clean:
            ai_clean = ai_clean.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_clean:
            ai_clean = ai_clean.split("```")[1].split("```")[0].strip()

        ai_data = json.loads(ai_clean)
        responses = ai_data.get("responses", [])

        text = "📬 <b>Получены предложения:</b>\n\n"
        for i, r in enumerate(responses):
            company = r.get("company_name", f"Поставщик {i+1}")
            price = r.get("price", 0)
            delivery = r.get("delivery_days", 0)
            warranty = r.get("warranty_months", 0)
            proposal = r.get("proposal_text", "")

            sup_match = None
            for sid, sname in suppliers:
                if sname.lower() in company.lower() or company.lower() in sname.lower():
                    sup_match = sid
                    break
            if not sup_match and i < len(suppliers):
                sup_match = suppliers[i][0]

            if sup_match:
                db_execute(
                    f"INSERT INTO {SCHEMA}.procurement_proposals "
                    f"(tender_id, supplier_id, price, currency, delivery_days, warranty_months, proposal_text, created_at) "
                    f"VALUES (%s, %s, %s, 'RUB', %s, %s, %s, NOW())",
                    [int(tender_id), sup_match, price, delivery, warranty, proposal]
                )
                db_execute(
                    f"INSERT INTO {SCHEMA}.procurement_messages "
                    f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
                    f"VALUES (%s, %s, 'incoming', 'proposal', 'Коммерческое предложение', %s, NOW())",
                    [int(tender_id), sup_match, proposal]
                )
                db_execute(
                    f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'responded' WHERE id = %s",
                    [sup_match]
                )

            price_str = f"{int(price):,}₽".replace(",", " ") if price else "—"
            text += f"🏢 <b>{company}</b>\n   💰 {price_str} | 📦 {delivery}дн | 🛡 {warranty}мес\n\n"

        db_execute(
            f"UPDATE {SCHEMA}.procurement_tenders SET status = 'evaluating', updated_at = NOW() WHERE id = %s",
            [int(tender_id)]
        )

        send_inline(chat_id, text, [
            [{"text": "📊 AI-анализ предложений", "callback_data": f"analyze_{tender_id}"}],
            [{"text": "📋 Подробнее", "callback_data": f"proposals_{tender_id}"}],
            [{"text": "◀️ К тендеру", "callback_data": f"tender_{tender_id}"}],
        ])
    except Exception as e:
        logger.error(f"simulate error: {e}", exc_info=True)
        send_inline(chat_id, f"❌ Ошибка: {str(e)[:200]}", [
            [{"text": "🔄 Повторить", "callback_data": f"sim_resp_{tender_id}"}],
        ])


def analyze_proposals(chat_id, user_id, tender_id):
    row = db_execute_one(
        f"SELECT title, description, criteria, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    title, description, criteria, budget_max = row

    proposals = db_execute(
        f"SELECT p.id, s.company_name, p.price, p.delivery_days, p.warranty_months, p.proposal_text "
        f"FROM {SCHEMA}.procurement_proposals p "
        f"JOIN {SCHEMA}.procurement_suppliers s ON s.id = p.supplier_id "
        f"WHERE p.tender_id = %s",
        [int(tender_id)]
    )
    if not proposals:
        send_message(chat_id, "❌ Нет предложений для анализа")
        return

    send_message(chat_id, "📊 AI анализирует предложения...")

    proposals_text = ""
    for pid, name, price, delivery, warranty, text_p in proposals:
        proposals_text += f"\n{name}: цена={price}, доставка={delivery}дн, гарантия={warranty}мес\nОписание: {text_p}\n"

    system_prompt = (
        "Проанализируй предложения поставщиков. Для каждого дай оценку от 0 до 100. "
        "Учитывай цену, сроки, гарантию и качество предложения. "
        'JSON: {"analysis": [{"company_name": "...", "score": число, "strengths": "...", "weaknesses": "..."}], '
        '"recommendation": "...", "summary": "..."}'
    )
    user_prompt = f"Тендер: {title}\nКритерии: {criteria}\nБюджет: {budget_max}\n\nПредложения:{proposals_text}"

    try:
        ai_text = call_llm(system_prompt, user_prompt, temperature=0.3)
        ai_clean = ai_text.strip()
        if "```json" in ai_clean:
            ai_clean = ai_clean.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_clean:
            ai_clean = ai_clean.split("```")[1].split("```")[0].strip()

        ai_data = json.loads(ai_clean)
        analysis = ai_data.get("analysis", [])
        summary = ai_data.get("summary", "")
        recommendation = ai_data.get("recommendation", "")

        for a in analysis:
            score = a.get("score", 0)
            company = a.get("company_name", "")
            for pid, name, *_ in proposals:
                if name.lower() in company.lower() or company.lower() in name.lower():
                    db_execute(
                        f"UPDATE {SCHEMA}.procurement_proposals SET score = %s WHERE id = %s",
                        [score, pid]
                    )
                    break

        db_execute(
            f"UPDATE {SCHEMA}.procurement_tenders SET ai_report = %s, updated_at = NOW() WHERE id = %s",
            [ai_text[:5000], int(tender_id)]
        )

        text = "📊 <b>Результаты анализа:</b>\n\n"
        for i, a in enumerate(sorted(analysis, key=lambda x: x.get("score", 0), reverse=True)):
            medal = "🥇" if i == 0 else "🥈" if i == 1 else "🥉" if i == 2 else f"{i+1}."
            text += (
                f"{medal} <b>{a.get('company_name', '?')}</b> — ⭐{a.get('score', 0)}/100\n"
                f"   ✅ {a.get('strengths', '—')}\n"
                f"   ⚠️ {a.get('weaknesses', '—')}\n\n"
            )
        if recommendation:
            text += f"💡 <b>Рекомендация:</b> {recommendation}\n"

        send_inline(chat_id, text, [
            [{"text": "📋 Выбрать победителя", "callback_data": f"proposals_{tender_id}"}],
            [{"text": "◀️ К тендеру", "callback_data": f"tender_{tender_id}"}],
        ])
    except Exception as e:
        logger.error(f"analyze error: {e}", exc_info=True)
        send_inline(chat_id, f"❌ Ошибка анализа: {str(e)[:200]}", [
            [{"text": "🔄 Повторить", "callback_data": f"analyze_{tender_id}"}],
        ])


def approve_supplier(chat_id, user_id, tender_id, supplier_id):
    sup_row = db_execute_one(
        f"SELECT company_name FROM {SCHEMA}.procurement_suppliers WHERE id = %s",
        [int(supplier_id)]
    )
    if not sup_row:
        send_message(chat_id, "❌ Поставщик не найден")
        return

    company_name = sup_row[0]

    db_execute(
        f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'awarded' WHERE id = %s",
        [int(supplier_id)]
    )
    db_execute(
        f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'rejected' "
        f"WHERE tender_id = %s AND id != %s AND status != 'awarded'",
        [int(tender_id), int(supplier_id)]
    )
    db_execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = 'awarded', updated_at = NOW() WHERE id = %s",
        [int(tender_id)]
    )
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, created_at) "
        f"VALUES (%s, 'approve_supplier', %s, NOW())",
        [int(tender_id), f"Победитель: {company_name}"]
    )

    text = (
        f"🏆 <b>Тендер завершён!</b>\n\n"
        f"Победитель: <b>{company_name}</b>\n\n"
        f"Поздравляем с успешным завершением закупки!"
    )
    send_inline(chat_id, text, [
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
        [{"text": "📋 Создать новый", "callback_data": "new_tender"}],
    ])


def reject_all(chat_id, user_id, tender_id):
    db_execute(
        f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'rejected' WHERE tender_id = %s",
        [int(tender_id)]
    )
    db_execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = 'cancelled', updated_at = NOW() WHERE id = %s",
        [int(tender_id)]
    )
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, created_at) "
        f"VALUES (%s, 'reject_all', 'Все предложения отклонены', NOW())",
        [int(tender_id)]
    )
    send_inline(chat_id, "❌ Все предложения отклонены, тендер отменён.", [
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
        [{"text": "📋 Создать новый", "callback_data": "new_tender"}],
    ])


def cancel_tender(chat_id, user_id, tender_id):
    db_execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = 'cancelled', updated_at = NOW() WHERE id = %s",
        [int(tender_id)]
    )
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, created_at) "
        f"VALUES (%s, 'cancel', 'Тендер отменён владельцем', NOW())",
        [int(tender_id)]
    )
    send_inline(chat_id, "❌ Тендер отменён.", [
        [{"text": "📂 Мои тендеры", "callback_data": "my_tenders"}],
    ])


def handle_supplier_question_text(chat_id, user_id, tender_id, question):
    send_typing(chat_id)
    row = db_execute_one(
        f"SELECT title, description, specifications FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        [int(tender_id)]
    )
    if not row:
        send_message(chat_id, "❌ Тендер не найден")
        return

    system_prompt = (
        "Ты — менеджер по закупкам. Ответь на вопрос поставщика корректно и дипломатично. Русский язык."
    )
    user_prompt = f"Тендер: {row[0]}\nОписание: {row[1]}\nВопрос поставщика: {question}"

    try:
        answer = call_llm(system_prompt, user_prompt, temperature=0.5)
        send_message(chat_id, f"💬 <b>Ответ AI:</b>\n\n{answer}")
    except Exception as e:
        send_message(chat_id, f"❌ Ошибка: {str(e)[:200]}")

    set_state(user_id, "tender_menu", {"tender_id": tender_id})
    show_tender_menu(chat_id, user_id, tender_id)


def handle_clarification_text(chat_id, user_id, tender_id, supplier_id, text_msg):
    send_typing(chat_id)
    db_execute(
        f"INSERT INTO {SCHEMA}.procurement_messages "
        f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
        f"VALUES (%s, %s, 'outgoing', 'clarification', 'Уточнение', %s, NOW())",
        [int(tender_id), int(supplier_id), text_msg]
    )
    send_message(chat_id, "✅ Уточнение отправлено поставщику.")
    set_state(user_id, "tender_menu", {"tender_id": tender_id})
    show_tender_menu(chat_id, user_id, tender_id)


# ==================== WEBHOOK SETUP ====================

def setup_webhook(webhook_url):
    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    if not webhook_url:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Передайте ?action=set_webhook&url=<URL этой функции>"})}

    if not BOT_TOKEN:
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": "PROCUREMENT_BOT_TOKEN not set"})}

    resp = requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook", json={"url": webhook_url}, timeout=10)
    result = resp.json()

    requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/deleteMyCommands", timeout=10)

    cmd_resp = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/setMyCommands",
        json={"commands": [
            {"command": "start", "description": "Начать работу"},
            {"command": "newtender", "description": "Создать тендер"},
            {"command": "mytenders", "description": "Мои тендеры"},
            {"command": "help", "description": "Помощь"},
        ]},
        timeout=10,
    )

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"webhook_result": result, "commands_set": cmd_resp.json(), "webhook_url": webhook_url})}