import json
import os
import urllib.request
import urllib.parse
import psycopg2

BOT_TOKEN = os.environ.get('EXPERT_BOT_TOKEN', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')
VSEGPT_API_KEY = os.environ.get('VSEGPT_API_KEY', '')
YOOKASSA_PAYMENT_URL = 'https://functions.poehali.dev/b41b8133-a3ad-4896-bda6-2b5ffa2bdeb3'
SELF_URL = 'https://functions.poehali.dev/a795746d-3812-4427-898e-b756ff0edc4f'
UNPACKING_PRICE = 1

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

SYSTEM_PROMPT = """Ты — топовый маркетолог, бренд-стратег и продюсер экспертов с 10-летним опытом. Твоя задача — проанализировать ответы эксперта на вопросы глубокой распаковки и выдать готовую, структурированную стратегию для его позиционирования, продвижения и продаж. Твой тон: профессиональный, вдохновляющий, структурный, без "воды", говоришь по делу, как наставник.
Ты работаешь по методологии, которая объединяет:
- Психологический анализ
- Маркетинговую стратегию (SWOT, JTBD, УТП)
- Бережный подход к личности эксперта

НА ВХОДЕ ТЫ ПОЛУЧИШЬ: Ответы эксперта на 17 вопросов (о нише, опыте, целевой аудитории, болях, продуктах, ценностях и страхах).

ТВОЯ ЗАДАЧА

На основе ответов эксперта создать профессиональную распаковку. Оформляй ответ в современном и красивом виде, используя в меру эмодзи и выделение заголовков ЗАГЛАВНЫМИ БУКВАМИ.

ВАЖНО: НЕ используй Markdown-разметку (**, ##, __, ``` и т.д.). Используй только plain text, эмодзи и ЗАГЛАВНЫЕ БУКВЫ для заголовков. Для списков используй тире (-) или эмодзи-маркеры.

Документ должен быть:
- Глубоким и психологически точным
- Практичным и применимым
- Бережным к личности эксперта
- Написанным живым, понятным языком
- Структурированным и визуально приятным


СТРУКТУРА ИТОГОВОГО ДОКУМЕНТА

1. ВАША СИЛА И СУТЬ

Проанализируй миссию, ценности и ответы эксперта. Выяви:

💎 ВАШ ДРАЙВ
- Зачем вы делаете то, что делаете (глубинная мотивация)
- Какую трансформацию создаете
- Кого усиливаете

❤️ ГЛУБИННАЯ ЦЕННОСТЬ
- Квинтэссенция подхода (1-2 фразы)

💼 ПРОФЕССИОНАЛЬНАЯ СИЛА
- Редкие сочетания компетенций
- Уникальные навыки
- В чем эксперт "гений"

⚡ СКРЫТЫЕ КОМПЕТЕНЦИИ
- Что люди чувствуют, но не могут сформулировать
- За что эксперта выбирают на самом деле

🧱 ВНУТРЕННИЕ БЛОКИ
- Проанализируй страхи и сомнения эксперта
- Дай бережную интерпретацию + как превратить в силу


2. SWOT-АНАЛИЗ

Создай анализ в 4 блока:

Сильные стороны (Strengths)
- На основе уникальности, результатов, опыта
- 5-7 пунктов

Слабые стороны (Weaknesses)
- Честно проанализируй зоны роста
- Без обесценивания

Возможности (Opportunities)
- Какие тренды играют на руку
- Где недонасыщенный рынок

Угрозы (Threats)
- Конкуренция
- Риски выгорания
- Зависимость от личного бренда

💥 Скрытая компетенция
- Что создает эксперт "невидимого", но мощного


3. ГЛУБОКИЙ АНАЛИЗ ЦЕЛЕВОЙ АУДИТОРИИ

Создай 2 детальных аватара клиента.

Для каждого аватара опиши:

1. Имя-ярлык (метафорическое, например: "Ирина-Уставшая", "Марина-Сомневающаяся")
2. Кто он в жизни (1-2 фразы)
3. Главный внутренний конфликт — два полюса ("хочу, но боюсь")
4. Чего стыдится / боится признать — 5 честных формулировок
5. Базовые эмоции — какие чувства им управляют
6. Типичные защитные механизмы (обесценивание, избегание, рационализация и т.д.)
7. Как он говорит — 10 фраз "из его рта": как ругается, как оправдывается, как объясняет, почему "сейчас не время"
8. Сценарий обычного дня — где всплывает тема продукта эксперта
9. Сценарий момента кризиса — сцена, где "прижало" и он готов меняться
10. Чего ждет от эксперта — что хочет получить, что хочет переложить, за что готов платить, чего не простит
11. Почему сливается из воронки — 3-5 причин
12. Чего никогда не купит — границы

После 2 аватаров напиши 5 конкретных идей, как использовать эти данные в контенте, офферах и воронке.


4. JTBD: РАБОТЫ, ТРИГГЕРЫ, БАРЬЕРЫ

1. Какую работу клиент "нанимает" продукт выполнять? Разложи на 4 уровня:

Уровень 1. Функциональная работа — что продукт делает буквально?
Уровень 2. Эмоциональная работа — что человек хочет почувствовать?
Уровень 3. Социальная работа — что хочет транслировать другим?
Уровень 4. Подсознательная работа — что не осознает, но делает?

2. Что запускает желание купить? (5-7 триггеров)
Раздели на: эмоциональные, социальные, ситуационные, триггеры-обострения

3. Что останавливает? (Барьеры)
Рациональные, эмоциональные, поведенческие, социальные барьеры


5. УНИКАЛЬНОЕ ТОРГОВОЕ ПРЕДЛОЖЕНИЕ

Создай 12 вариантов УТП по разным техникам:

1. Метод контраста
2. Фокус на уникальных качествах
3. Экстремальная срочность
4. Смешение несовместимого
5. "Ноль рисков"
6. Магия цифр
7. Шокирующая истина
8. Анатомия прорыва
9. Эксклюзивность
10. Эмоциональная привязка
11. Ценовая уникальность
12. Анализ болей и выгод

Пиши на русском языке. Будь конкретным, давай практические рекомендации."""


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


def clean_markdown(text):
    import re
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def generate_unpacking(answers_text):
    url = "https://api.vsegpt.ru/v1/chat/completions"
    payload = {
        "model": "openai/gpt-5.4-xhigh",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Вот ответы эксперта на 17 вопросов распаковки:\n\n{answers_text}\n\nСоздай полную профессиональную распаковку по всем 5 разделам структуры."}
        ],
        "max_tokens": 10000,
        "temperature": 0.7,
        "stream": False
    }
    data = json.dumps(payload).encode('utf-8')
    print(f"[VSEGPT] Sending request, payload size: {len(data)} bytes")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {VSEGPT_API_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as resp:
            raw = resp.read()
            print(f"[VSEGPT] Response received, size: {len(raw)} bytes")
            result = json.loads(raw)
            if 'error' in result:
                print(f"[VSEGPT] API error: {result['error']}")
                return None
            content = result['choices'][0]['message']['content']
            print(f"[VSEGPT] Success, content length: {len(content)}")
            return clean_markdown(content)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print(f"[VSEGPT] HTTP error {e.code}: {body[:500]}")
        return None
    except Exception as e:
        print(f"[VSEGPT] Error: {type(e).__name__}: {e}")
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

    cur2 = conn.cursor()
    cur2.execute("SELECT status FROM expert_users WHERE telegram_id = '%s'" % telegram_id.replace("'", "''"))
    row2 = cur2.fetchone()
    current_status = row2[0] if row2 else 'new'

    if current_status == 'generating':
        send_message(chat_id, "⏳ Генерация уже запущена. Пожалуйста, дождитесь результата.")
        return

    if current_status == 'finished':
        send_message(chat_id, "✅ Ваша распаковка уже была сгенерирована. Чтобы пройти заново — напишите /start")
        return

    cur3 = conn.cursor()
    cur3.execute(
        "UPDATE expert_users SET status = 'generating', updated_at = NOW() WHERE telegram_id = '%s'"
        % telegram_id.replace("'", "''")
    )
    conn.commit()

    send_message(chat_id, "⏳ Генерирую вашу персональную распаковку экспертности... Это может занять 2-4 минуты. Я напишу, когда будет готово.")

    import threading
    def fire_async():
        payload = json.dumps({"_internal": "generate", "chat_id": chat_id, "telegram_id": telegram_id}).encode('utf-8')
        req = urllib.request.Request(SELF_URL, data=payload, headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req, timeout=3)
        except:
            pass
    t = threading.Thread(target=fire_async)
    t.start()


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

    if body.get('_internal') == 'generate':
        chat_id = body['chat_id']
        telegram_id = body['telegram_id']
        conn = get_db_connection()
        try:
            answers = get_all_answers(conn, telegram_id)
            answers_text = ""
            for q_num, q_text, answer in answers:
                answers_text += f"Вопрос {q_num}: {q_text}\nОтвет: {answer}\n\n"
            print(f"[GENERATE] Starting VseGPT call for {telegram_id}")
            result = generate_unpacking(answers_text)
            if result:
                print(f"[GENERATE] Success for {telegram_id}, length={len(result)}")
                send_message(chat_id, "✅ Ваша распаковка экспертности готова!\n\n" + "=" * 30)
                send_long_message(chat_id, result)
                mark_finished(conn, telegram_id)
                send_message(chat_id, "\n🎉 Распаковка завершена! Чтобы пройти заново — напишите /start")
            else:
                print(f"[GENERATE] Failed for {telegram_id}")
                cur = conn.cursor()
                cur.execute(
                    "UPDATE expert_users SET status = 'completed', updated_at = NOW() WHERE telegram_id = '%s'"
                    % telegram_id.replace("'", "''")
                )
                conn.commit()
                send_message(chat_id, "❌ Не удалось получить ответ от нейросети. Попробуйте позже — напишите /done")
        finally:
            conn.close()
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