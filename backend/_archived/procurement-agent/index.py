"""AI-агент для управления закупками: тендеры, поставщики, RFQ, анализ предложений"""

import json
import os
import urllib.request
import urllib.error
import psycopg2
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
OPENROUTER_KEY = os.environ.get('OPENROUTER_API_KEY', '')
LLM_MODEL = 'google/gemini-2.0-flash-exp:free'


def get_db():
    """Подключение к базе данных"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Вызов LLM через OpenRouter API"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "max_tokens": 4000
    }
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers=headers)
    resp = urllib.request.urlopen(req, timeout=60)
    result = json.loads(resp.read().decode('utf-8'))
    return result['choices'][0]['message']['content']


def log_action(cur, tender_id: int, action: str, details: str, ai_reasoning: str = None):
    """Записывает лог действия в procurement_logs"""
    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_logs (tender_id, action, details, ai_reasoning, created_at) "
        f"VALUES (%s, %s, %s, %s, NOW())",
        (tender_id, action, details, ai_reasoning)
    )


def resp(status_code: int, body: dict) -> dict:
    """Формирует HTTP-ответ"""
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(body, ensure_ascii=False, default=str)
    }


def serialize_row(row, columns: list) -> dict:
    """Сериализует строку БД в словарь с обработкой datetime"""
    result = {}
    for i, col in enumerate(columns):
        val = row[i]
        if isinstance(val, datetime):
            val = val.isoformat()
        result[col] = val
    return result


# ==================== TENDER CRUD ====================

def action_create_tender(body: dict, cur) -> dict:
    """Создание нового тендера"""
    owner_id = body.get('owner_id')
    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    specifications = body.get('specifications', '').strip()
    criteria = body.get('criteria', '').strip()
    budget_max = body.get('budget_max')
    min_suppliers = body.get('min_suppliers', 3)
    response_deadline_days = body.get('response_deadline_days', 14)

    if not owner_id or not title:
        return resp(400, {'error': 'owner_id и title обязательны'})

    deadline = datetime.now() + timedelta(days=response_deadline_days)

    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_tenders "
        f"(owner_id, title, description, specifications, criteria, budget_max, "
        f"min_suppliers, response_deadline, status, created_at, updated_at) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'draft', NOW(), NOW()) RETURNING id",
        (owner_id, title, description, specifications, criteria, budget_max,
         min_suppliers, deadline)
    )
    tender_id = cur.fetchone()[0]

    log_action(cur, tender_id, 'create_tender', f'Тендер "{title}" создан')

    return resp(200, {'ok': True, 'tender_id': tender_id})


def action_get_tenders(params: dict, body: dict, cur) -> dict:
    """Список тендеров владельца"""
    owner_id = params.get('owner_id') or body.get('owner_id')
    if not owner_id:
        return resp(400, {'error': 'owner_id обязателен'})

    cur.execute(
        f"SELECT id, owner_id, title, description, status, budget_max, "
        f"response_deadline, created_at, updated_at "
        f"FROM {SCHEMA}.procurement_tenders "
        f"WHERE owner_id = %s ORDER BY created_at DESC",
        (owner_id,)
    )
    columns = ['id', 'owner_id', 'title', 'description', 'status', 'budget_max',
               'response_deadline', 'created_at', 'updated_at']
    tenders = [serialize_row(r, columns) for r in cur.fetchall()]

    return resp(200, {'tenders': tenders})


def action_get_tender(params: dict, body: dict, cur) -> dict:
    """Детальная информация о тендере с поставщиками, предложениями, сообщениями и логами"""
    tender_id = params.get('tender_id') or body.get('tender_id')
    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT id, owner_id, title, description, specifications, criteria, "
        f"budget_max, min_suppliers, response_deadline, status, ai_report, "
        f"created_at, updated_at "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    row = cur.fetchone()
    if not row:
        return resp(404, {'error': 'Тендер не найден'})

    tender_cols = ['id', 'owner_id', 'title', 'description', 'specifications', 'criteria',
                   'budget_max', 'min_suppliers', 'response_deadline', 'status', 'ai_report',
                   'created_at', 'updated_at']
    tender = serialize_row(row, tender_cols)

    # Поставщики
    cur.execute(
        f"SELECT id, tender_id, company_name, email, website, status, created_at "
        f"FROM {SCHEMA}.procurement_suppliers WHERE tender_id = %s ORDER BY created_at",
        (int(tender_id),)
    )
    supplier_cols = ['id', 'tender_id', 'company_name', 'email', 'website', 'status', 'created_at']
    tender['suppliers'] = [serialize_row(r, supplier_cols) for r in cur.fetchall()]

    # Предложения
    cur.execute(
        f"SELECT id, tender_id, supplier_id, price, currency, delivery_days, "
        f"warranty_months, proposal_text, score, created_at "
        f"FROM {SCHEMA}.procurement_proposals WHERE tender_id = %s ORDER BY score DESC NULLS LAST",
        (int(tender_id),)
    )
    proposal_cols = ['id', 'tender_id', 'supplier_id', 'price', 'currency', 'delivery_days',
                     'warranty_months', 'proposal_text', 'score', 'created_at']
    tender['proposals'] = [serialize_row(r, proposal_cols) for r in cur.fetchall()]

    # Сообщения
    cur.execute(
        f"SELECT id, tender_id, supplier_id, direction, message_type, subject, body, created_at "
        f"FROM {SCHEMA}.procurement_messages WHERE tender_id = %s ORDER BY created_at",
        (int(tender_id),)
    )
    msg_cols = ['id', 'tender_id', 'supplier_id', 'direction', 'message_type', 'subject', 'body', 'created_at']
    tender['messages'] = [serialize_row(r, msg_cols) for r in cur.fetchall()]

    # Логи
    cur.execute(
        f"SELECT id, tender_id, action, details, ai_reasoning, created_at "
        f"FROM {SCHEMA}.procurement_logs WHERE tender_id = %s ORDER BY created_at",
        (int(tender_id),)
    )
    log_cols = ['id', 'tender_id', 'action', 'details', 'ai_reasoning', 'created_at']
    tender['logs'] = [serialize_row(r, log_cols) for r in cur.fetchall()]

    return resp(200, {'tender': tender})


def action_update_tender_status(body: dict, cur) -> dict:
    """Обновление статуса тендера"""
    tender_id = body.get('tender_id')
    new_status = body.get('status')
    if not tender_id or not new_status:
        return resp(400, {'error': 'tender_id и status обязательны'})

    valid_statuses = ['draft', 'active', 'evaluating', 'awarded', 'cancelled', 'completed']
    if new_status not in valid_statuses:
        return resp(400, {'error': f'Недопустимый статус. Допустимые: {", ".join(valid_statuses)}'})

    cur.execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = %s, updated_at = NOW() "
        f"WHERE id = %s RETURNING id",
        (new_status, int(tender_id))
    )
    row = cur.fetchone()
    if not row:
        return resp(404, {'error': 'Тендер не найден'})

    log_action(cur, int(tender_id), 'update_status', f'Статус изменён на {new_status}')

    return resp(200, {'ok': True, 'tender_id': row[0], 'status': new_status})


# ==================== SUPPLIER MANAGEMENT ====================

def action_add_suppliers(body: dict, cur) -> dict:
    """Добавление поставщиков к тендеру вручную"""
    tender_id = body.get('tender_id')
    suppliers = body.get('suppliers', [])

    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})
    if not suppliers:
        return resp(400, {'error': 'suppliers список обязателен'})

    added = []
    for s in suppliers:
        company_name = s.get('company_name', '').strip()
        email = s.get('email', '').strip()
        website = s.get('website', '').strip()

        if not company_name:
            continue

        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_suppliers "
            f"(tender_id, company_name, email, website, status, created_at) "
            f"VALUES (%s, %s, %s, %s, 'new', NOW()) RETURNING id",
            (int(tender_id), company_name, email, website)
        )
        supplier_id = cur.fetchone()[0]
        added.append({'id': supplier_id, 'company_name': company_name})

    log_action(cur, int(tender_id), 'add_suppliers',
               f'Добавлено {len(added)} поставщиков: {", ".join(s["company_name"] for s in added)}')

    return resp(200, {'ok': True, 'added': added, 'count': len(added)})


def action_search_suppliers(body: dict, cur) -> dict:
    """AI ищет поставщиков на основе описания тендера"""
    tender_id = body.get('tender_id')
    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT title, description, specifications, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    row = cur.fetchone()
    if not row:
        return resp(404, {'error': 'Тендер не найден'})

    title, description, specifications, budget_max = row

    system_prompt = (
        "Ты — AI-ассистент по закупкам. Тебе нужно предложить список потенциальных поставщиков "
        "для данного тендера. Сгенерируй реалистичных поставщиков с названиями компаний, "
        "контактными email и сайтами. Ответ строго в JSON формате: "
        '{"suppliers": [{"company_name": "...", "email": "...", "website": "...", "reason": "..."}]}'
        " Предложи 5-8 поставщиков. Поле reason — краткое обоснование выбора."
    )
    user_prompt = (
        f"Тендер: {title}\n"
        f"Описание: {description}\n"
        f"Спецификации: {specifications}\n"
        f"Бюджет: {budget_max}"
    )

    ai_text = call_llm(system_prompt, user_prompt, temperature=0.8)

    # Парсим JSON из ответа AI
    ai_text_clean = ai_text.strip()
    if '```json' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```json')[1].split('```')[0].strip()
    elif '```' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```')[1].split('```')[0].strip()

    ai_data = json.loads(ai_text_clean)
    found_suppliers = ai_data.get('suppliers', [])

    added = []
    for s in found_suppliers:
        company_name = s.get('company_name', '').strip()
        email = s.get('email', '').strip()
        website = s.get('website', '').strip()
        reason = s.get('reason', '')

        if not company_name:
            continue

        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_suppliers "
            f"(tender_id, company_name, email, website, status, created_at) "
            f"VALUES (%s, %s, %s, %s, 'found', NOW()) RETURNING id",
            (int(tender_id), company_name, email, website)
        )
        supplier_id = cur.fetchone()[0]
        added.append({'id': supplier_id, 'company_name': company_name, 'reason': reason})

    log_action(cur, int(tender_id), 'search_suppliers',
               f'AI нашёл {len(added)} поставщиков',
               ai_reasoning=ai_text[:2000])

    return resp(200, {'ok': True, 'suppliers': added, 'count': len(added), 'ai_reasoning': ai_text[:1000]})


# ==================== COMMUNICATION ====================

def action_send_rfq(body: dict, cur) -> dict:
    """AI генерирует и отправляет RFQ всем поставщикам тендера"""
    tender_id = body.get('tender_id')
    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT title, description, specifications, criteria, budget_max, response_deadline "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    title, description, specifications, criteria, budget_max, response_deadline = tender_row

    cur.execute(
        f"SELECT id, company_name, email FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND status IN ('new', 'found')",
        (int(tender_id),)
    )
    suppliers = cur.fetchall()

    if not suppliers:
        return resp(400, {'error': 'Нет доступных поставщиков для отправки RFQ'})

    deadline_str = response_deadline.isoformat() if isinstance(response_deadline, datetime) else str(response_deadline)

    system_prompt = (
        "Ты — профессиональный менеджер по закупкам. Составь официальное письмо-запрос "
        "коммерческого предложения (RFQ) для поставщика. Письмо должно быть вежливым, "
        "деловым и содержать все необходимые детали тендера. Пиши на русском языке. "
        "Формат: тема письма на первой строке после 'Тема:', затем пустая строка и текст письма."
    )

    sent = []
    for supplier_id, company_name, email in suppliers:
        user_prompt = (
            f"Компания-получатель: {company_name}\n"
            f"Email: {email}\n"
            f"Тендер: {title}\n"
            f"Описание: {description}\n"
            f"Спецификации: {specifications}\n"
            f"Критерии оценки: {criteria}\n"
            f"Максимальный бюджет: {budget_max}\n"
            f"Дедлайн ответа: {deadline_str}"
        )

        ai_text = call_llm(system_prompt, user_prompt, temperature=0.5)

        # Парсим тему и тело письма
        lines = ai_text.strip().split('\n')
        subject = title
        body_text = ai_text
        for i, line in enumerate(lines):
            if line.lower().startswith('тема:'):
                subject = line.split(':', 1)[1].strip()
                body_text = '\n'.join(lines[i+1:]).strip()
                break

        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_messages "
            f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
            f"VALUES (%s, %s, 'outgoing', 'rfq', %s, %s, NOW())",
            (int(tender_id), supplier_id, subject, body_text)
        )

        cur.execute(
            f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'contacted' WHERE id = %s",
            (supplier_id,)
        )

        sent.append({'supplier_id': supplier_id, 'company_name': company_name, 'subject': subject})

    # Обновляем статус тендера
    cur.execute(
        f"UPDATE {SCHEMA}.procurement_tenders SET status = 'active', updated_at = NOW() WHERE id = %s",
        (int(tender_id),)
    )

    log_action(cur, int(tender_id), 'send_rfq',
               f'RFQ отправлен {len(sent)} поставщикам',
               ai_reasoning=f'Сгенерированы персонализированные RFQ для: {", ".join(s["company_name"] for s in sent)}')

    return resp(200, {'ok': True, 'sent': sent, 'count': len(sent)})


def action_simulate_responses(body: dict, cur) -> dict:
    """MVP: AI симулирует реалистичные ответы поставщиков"""
    tender_id = body.get('tender_id')
    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT title, description, specifications, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    title, description, specifications, budget_max = tender_row

    cur.execute(
        f"SELECT id, company_name FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND status = 'contacted'",
        (int(tender_id),)
    )
    suppliers = cur.fetchall()

    if not suppliers:
        return resp(400, {'error': 'Нет поставщиков со статусом contacted'})

    supplier_names = ', '.join(name for _, name in suppliers)

    system_prompt = (
        "Ты симулируешь ответы поставщиков на тендер. Для каждого поставщика сгенерируй "
        "реалистичное коммерческое предложение с разными ценами, сроками и условиями. "
        "Некоторые предложения должны быть лучше других. Ответ строго в JSON: "
        '{"responses": [{"company_name": "...", "price": 0, "currency": "RUB", '
        '"delivery_days": 0, "warranty_months": 0, "proposal_text": "..."}]}'
        " Цены должны быть реалистичными относительно бюджета."
    )
    user_prompt = (
        f"Тендер: {title}\n"
        f"Описание: {description}\n"
        f"Спецификации: {specifications}\n"
        f"Бюджет: {budget_max}\n"
        f"Поставщики: {supplier_names}"
    )

    ai_text = call_llm(system_prompt, user_prompt, temperature=0.9)

    ai_text_clean = ai_text.strip()
    if '```json' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```json')[1].split('```')[0].strip()
    elif '```' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```')[1].split('```')[0].strip()

    ai_data = json.loads(ai_text_clean)
    responses = ai_data.get('responses', [])

    proposals = []
    for i, (supplier_id, company_name) in enumerate(suppliers):
        r = responses[i] if i < len(responses) else responses[-1] if responses else {
            'price': float(budget_max or 100000) * 0.9,
            'currency': 'RUB',
            'delivery_days': 30,
            'warranty_months': 12,
            'proposal_text': 'Стандартное предложение'
        }

        price = float(r.get('price', 0))
        currency = r.get('currency', 'RUB')
        delivery_days = int(r.get('delivery_days', 30))
        warranty_months = int(r.get('warranty_months', 12))
        proposal_text = r.get('proposal_text', '')

        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_proposals "
            f"(tender_id, supplier_id, price, currency, delivery_days, "
            f"warranty_months, proposal_text, created_at) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id",
            (int(tender_id), supplier_id, price, currency, delivery_days,
             warranty_months, proposal_text)
        )
        proposal_id = cur.fetchone()[0]

        # Сохраняем как входящее сообщение
        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_messages "
            f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
            f"VALUES (%s, %s, 'incoming', 'proposal', %s, %s, NOW())",
            (int(tender_id), supplier_id, f'КП от {company_name}', proposal_text)
        )

        cur.execute(
            f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'responded' WHERE id = %s",
            (supplier_id,)
        )

        proposals.append({
            'proposal_id': proposal_id,
            'supplier_id': supplier_id,
            'company_name': company_name,
            'price': price,
            'currency': currency,
            'delivery_days': delivery_days
        })

    log_action(cur, int(tender_id), 'simulate_responses',
               f'Симулированы ответы от {len(proposals)} поставщиков',
               ai_reasoning=ai_text[:2000])

    return resp(200, {'ok': True, 'proposals': proposals, 'count': len(proposals)})


def action_send_clarification(body: dict, cur) -> dict:
    """AI отправляет запрос на уточнение конкретному поставщику"""
    tender_id = body.get('tender_id')
    supplier_id = body.get('supplier_id')
    question = body.get('question', '').strip()

    if not tender_id or not supplier_id:
        return resp(400, {'error': 'tender_id и supplier_id обязательны'})

    cur.execute(
        f"SELECT title, description FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    cur.execute(
        f"SELECT company_name, email FROM {SCHEMA}.procurement_suppliers WHERE id = %s",
        (int(supplier_id),)
    )
    supplier_row = cur.fetchone()
    if not supplier_row:
        return resp(404, {'error': 'Поставщик не найден'})

    company_name, email = supplier_row

    system_prompt = (
        "Ты — менеджер по закупкам. Составь вежливое деловое письмо с запросом "
        "на уточнение деталей коммерческого предложения. Письмо на русском языке. "
        "Формат: тема на первой строке после 'Тема:', затем пустая строка и текст."
    )
    user_prompt = (
        f"Компания: {company_name}\n"
        f"Тендер: {tender_row[0]}\n"
        f"Вопрос/уточнение: {question or 'Просим уточнить условия поставки, гарантии и финальную цену'}"
    )

    ai_text = call_llm(system_prompt, user_prompt, temperature=0.5)

    lines = ai_text.strip().split('\n')
    subject = f'Уточнение по тендеру: {tender_row[0]}'
    body_text = ai_text
    for i, line in enumerate(lines):
        if line.lower().startswith('тема:'):
            subject = line.split(':', 1)[1].strip()
            body_text = '\n'.join(lines[i+1:]).strip()
            break

    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_messages "
        f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
        f"VALUES (%s, %s, 'outgoing', 'clarification', %s, %s, NOW())",
        (int(tender_id), int(supplier_id), subject, body_text)
    )

    log_action(cur, int(tender_id), 'send_clarification',
               f'Запрос на уточнение отправлен поставщику {company_name}',
               ai_reasoning=ai_text[:1000])

    return resp(200, {'ok': True, 'supplier': company_name, 'subject': subject, 'body': body_text})


# ==================== ANALYSIS ====================

def action_analyze_proposals(body: dict, cur) -> dict:
    """AI анализирует все предложения, ранжирует и генерирует отчёт"""
    tender_id = body.get('tender_id')
    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT title, description, specifications, criteria, budget_max "
        f"FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    title, description, specifications, criteria, budget_max = tender_row

    cur.execute(
        f"SELECT p.id, p.supplier_id, s.company_name, p.price, p.currency, "
        f"p.delivery_days, p.warranty_months, p.proposal_text "
        f"FROM {SCHEMA}.procurement_proposals p "
        f"JOIN {SCHEMA}.procurement_suppliers s ON s.id = p.supplier_id "
        f"WHERE p.tender_id = %s",
        (int(tender_id),)
    )
    proposals = cur.fetchall()

    if not proposals:
        return resp(400, {'error': 'Нет предложений для анализа'})

    proposals_text = ""
    for p_id, s_id, name, price, currency, delivery, warranty, text in proposals:
        proposals_text += (
            f"\n--- {name} (ID поставщика: {s_id}, ID предложения: {p_id}) ---\n"
            f"Цена: {price} {currency}\n"
            f"Срок поставки: {delivery} дней\n"
            f"Гарантия: {warranty} месяцев\n"
            f"Описание: {text}\n"
        )

    system_prompt = (
        "Ты — эксперт по анализу закупок. Проанализируй все предложения поставщиков "
        "и составь детальный отчёт с ранжированием. Оцени каждое предложение по шкале 0-100. "
        "Ответ в JSON: "
        '{"rankings": [{"supplier_id": 0, "proposal_id": 0, "company_name": "...", "score": 0, '
        '"strengths": "...", "weaknesses": "...", "recommendation": "..."}], '
        '"summary": "...", "winner_supplier_id": 0, "reasoning": "..."}'
        " Учитывай цену, сроки, гарантию и соответствие спецификациям."
    )
    user_prompt = (
        f"Тендер: {title}\n"
        f"Описание: {description}\n"
        f"Спецификации: {specifications}\n"
        f"Критерии оценки: {criteria}\n"
        f"Бюджет: {budget_max}\n"
        f"\nПредложения:{proposals_text}"
    )

    ai_text = call_llm(system_prompt, user_prompt, temperature=0.3)

    ai_text_clean = ai_text.strip()
    if '```json' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```json')[1].split('```')[0].strip()
    elif '```' in ai_text_clean:
        ai_text_clean = ai_text_clean.split('```')[1].split('```')[0].strip()

    ai_data = json.loads(ai_text_clean)
    rankings = ai_data.get('rankings', [])

    # Обновляем score в proposals
    for r in rankings:
        proposal_id = r.get('proposal_id')
        score = r.get('score', 0)
        if proposal_id:
            cur.execute(
                f"UPDATE {SCHEMA}.procurement_proposals SET score = %s WHERE id = %s",
                (int(score), int(proposal_id))
            )

    # Сохраняем отчёт в тендер
    report_text = ai_data.get('summary', '') + '\n\n' + ai_data.get('reasoning', '')
    cur.execute(
        f"UPDATE {SCHEMA}.procurement_tenders "
        f"SET ai_report = %s, status = 'evaluating', updated_at = NOW() WHERE id = %s",
        (json.dumps(ai_data, ensure_ascii=False), int(tender_id))
    )

    log_action(cur, int(tender_id), 'analyze_proposals',
               f'Анализ {len(proposals)} предложений завершён. Лидер: supplier_id={ai_data.get("winner_supplier_id")}',
               ai_reasoning=ai_text[:2000])

    return resp(200, {
        'ok': True,
        'rankings': rankings,
        'summary': ai_data.get('summary', ''),
        'winner_supplier_id': ai_data.get('winner_supplier_id'),
        'reasoning': ai_data.get('reasoning', '')
    })


def action_approve_supplier(body: dict, cur) -> dict:
    """Утверждение победителя тендера"""
    tender_id = body.get('tender_id')
    supplier_id = body.get('supplier_id')

    if not tender_id or not supplier_id:
        return resp(400, {'error': 'tender_id и supplier_id обязательны'})

    cur.execute(
        f"SELECT title FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    tender_title = tender_row[0]

    # Получаем победителя
    cur.execute(
        f"SELECT company_name, email FROM {SCHEMA}.procurement_suppliers WHERE id = %s",
        (int(supplier_id),)
    )
    winner_row = cur.fetchone()
    if not winner_row:
        return resp(404, {'error': 'Поставщик не найден'})

    winner_name = winner_row[0]

    # Генерируем письмо победителю
    winner_text = call_llm(
        "Ты — менеджер по закупкам. Составь официальное поздравительное письмо "
        "победителю тендера. Краткое, деловое, на русском.",
        f"Тендер: {tender_title}\nПобедитель: {winner_name}",
        temperature=0.5
    )

    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_messages "
        f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
        f"VALUES (%s, %s, 'outgoing', 'award', %s, %s, NOW())",
        (int(tender_id), int(supplier_id), f'Победа в тендере: {tender_title}', winner_text)
    )

    cur.execute(
        f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'winner' WHERE id = %s",
        (int(supplier_id),)
    )

    # Отклоняем остальных
    cur.execute(
        f"SELECT id, company_name FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND id != %s AND status NOT IN ('rejected')",
        (int(tender_id), int(supplier_id))
    )
    losers = cur.fetchall()

    rejection_text = call_llm(
        "Ты — менеджер по закупкам. Составь вежливое письмо об отклонении предложения "
        "в тендере. Поблагодари за участие, выскажи надежду на сотрудничество в будущем. "
        "Краткое, деловое, на русском.",
        f"Тендер: {tender_title}",
        temperature=0.5
    )

    for loser_id, loser_name in losers:
        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_messages "
            f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
            f"VALUES (%s, %s, 'outgoing', 'rejection', %s, %s, NOW())",
            (int(tender_id), loser_id, f'Результаты тендера: {tender_title}', rejection_text)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'rejected' WHERE id = %s",
            (loser_id,)
        )

    # Обновляем тендер
    cur.execute(
        f"UPDATE {SCHEMA}.procurement_tenders "
        f"SET status = 'awarded', updated_at = NOW() WHERE id = %s",
        (int(tender_id),)
    )

    log_action(cur, int(tender_id), 'approve_supplier',
               f'Победитель: {winner_name}. Отклонено: {len(losers)} поставщиков',
               ai_reasoning=f'Письмо победителю и {len(losers)} писем об отклонении сгенерированы AI')

    return resp(200, {
        'ok': True,
        'winner': {'supplier_id': int(supplier_id), 'company_name': winner_name},
        'rejected_count': len(losers)
    })


def action_reject_all(body: dict, cur) -> dict:
    """Отклонение всех поставщиков с вежливыми уведомлениями"""
    tender_id = body.get('tender_id')
    reason = body.get('reason', '').strip()

    if not tender_id:
        return resp(400, {'error': 'tender_id обязателен'})

    cur.execute(
        f"SELECT title FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    tender_title = tender_row[0]

    cur.execute(
        f"SELECT id, company_name FROM {SCHEMA}.procurement_suppliers "
        f"WHERE tender_id = %s AND status NOT IN ('rejected')",
        (int(tender_id),)
    )
    suppliers = cur.fetchall()

    if not suppliers:
        return resp(400, {'error': 'Нет поставщиков для отклонения'})

    rejection_text = call_llm(
        "Ты — менеджер по закупкам. Составь вежливое письмо об отмене тендера "
        "и отклонении всех предложений. Поблагодари за участие, выскажи надежду "
        "на сотрудничество в будущем. Краткое, деловое, на русском.",
        f"Тендер: {tender_title}\nПричина отмены: {reason or 'Тендер отменён по внутренним причинам'}",
        temperature=0.5
    )

    for supplier_id, company_name in suppliers:
        cur.execute(
            f"INSERT INTO {SCHEMA}.procurement_messages "
            f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
            f"VALUES (%s, %s, 'outgoing', 'rejection', %s, %s, NOW())",
            (int(tender_id), supplier_id, f'Отмена тендера: {tender_title}', rejection_text)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.procurement_suppliers SET status = 'rejected' WHERE id = %s",
            (supplier_id,)
        )

    cur.execute(
        f"UPDATE {SCHEMA}.procurement_tenders "
        f"SET status = 'cancelled', updated_at = NOW() WHERE id = %s",
        (int(tender_id),)
    )

    log_action(cur, int(tender_id), 'reject_all',
               f'Все {len(suppliers)} поставщиков отклонены. Причина: {reason or "не указана"}',
               ai_reasoning=rejection_text[:1000])

    return resp(200, {'ok': True, 'rejected_count': len(suppliers)})


# ==================== SUPPORT ====================

def action_handle_supplier_question(body: dict, cur) -> dict:
    """AI отвечает на вопрос поставщика об отклонении"""
    tender_id = body.get('tender_id')
    supplier_id = body.get('supplier_id')
    question = body.get('question', '').strip()

    if not tender_id or not supplier_id or not question:
        return resp(400, {'error': 'tender_id, supplier_id и question обязательны'})

    cur.execute(
        f"SELECT title, ai_report FROM {SCHEMA}.procurement_tenders WHERE id = %s",
        (int(tender_id),)
    )
    tender_row = cur.fetchone()
    if not tender_row:
        return resp(404, {'error': 'Тендер не найден'})

    tender_title, ai_report = tender_row

    cur.execute(
        f"SELECT company_name, status FROM {SCHEMA}.procurement_suppliers WHERE id = %s",
        (int(supplier_id),)
    )
    supplier_row = cur.fetchone()
    if not supplier_row:
        return resp(404, {'error': 'Поставщик не найден'})

    company_name, supplier_status = supplier_row

    system_prompt = (
        "Ты — дипломатичный менеджер по закупкам. Поставщик задаёт вопрос о результатах тендера. "
        "Ответь вежливо, профессионально и конструктивно. Не раскрывай конфиденциальные данные "
        "других поставщиков (цены, условия). Можно указать общие причины решения. "
        "Предложи возможности для будущего сотрудничества. Ответ на русском языке."
    )
    user_prompt = (
        f"Тендер: {tender_title}\n"
        f"Поставщик: {company_name}\n"
        f"Статус поставщика: {supplier_status}\n"
        f"Отчёт AI (конфиденциально): {ai_report[:1000] if ai_report else 'Нет отчёта'}\n"
        f"Вопрос поставщика: {question}"
    )

    ai_text = call_llm(system_prompt, user_prompt, temperature=0.5)

    # Сохраняем входящий вопрос
    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_messages "
        f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
        f"VALUES (%s, %s, 'incoming', 'question', %s, %s, NOW())",
        (int(tender_id), int(supplier_id), f'Вопрос от {company_name}', question)
    )

    # Сохраняем ответ
    cur.execute(
        f"INSERT INTO {SCHEMA}.procurement_messages "
        f"(tender_id, supplier_id, direction, message_type, subject, body, created_at) "
        f"VALUES (%s, %s, 'outgoing', 'answer', %s, %s, NOW())",
        (int(tender_id), int(supplier_id), f'Ответ на вопрос: {company_name}', ai_text)
    )

    log_action(cur, int(tender_id), 'handle_supplier_question',
               f'Ответ на вопрос от {company_name}: "{question[:100]}"',
               ai_reasoning=ai_text[:1000])

    return resp(200, {'ok': True, 'answer': ai_text, 'supplier': company_name})


# ==================== MAIN HANDLER ====================

ACTION_MAP = {
    'create_tender': action_create_tender,
    'get_tenders': None,  # handled separately (needs params)
    'get_tender': None,   # handled separately (needs params)
    'update_tender_status': action_update_tender_status,
    'add_suppliers': action_add_suppliers,
    'search_suppliers': action_search_suppliers,
    'send_rfq': action_send_rfq,
    'simulate_responses': action_simulate_responses,
    'send_clarification': action_send_clarification,
    'analyze_proposals': action_analyze_proposals,
    'approve_supplier': action_approve_supplier,
    'reject_all': action_reject_all,
    'handle_supplier_question': action_handle_supplier_question,
}


def handler(event: dict, context) -> dict:
    """AI-агент для управления закупками — тендеры, поставщики, RFQ, анализ предложений и коммуникации"""

    method = event.get('httpMethod', 'GET')

    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }

    params = event.get('queryStringParameters') or {}

    # GET запросы
    if method == 'GET':
        action = params.get('action', '')
        conn = get_db()
        cur = conn.cursor()
        try:
            if action == 'get_tenders':
                return action_get_tenders(params, {}, cur)
            if action == 'get_tender':
                return action_get_tender(params, {}, cur)
            return resp(200, {'status': 'ok', 'service': 'procurement-agent', 'actions': list(ACTION_MAP.keys())})
        finally:
            cur.close()
            conn.close()

    # POST запросы
    if method != 'POST':
        return resp(405, {'error': 'Метод не поддержан'})

    body = json.loads(event.get('body', '{}'))
    action = body.get('action', '')

    if not action:
        return resp(400, {'error': 'Поле action обязательно'})

    if action not in ACTION_MAP:
        return resp(400, {'error': f'Неизвестное действие: {action}', 'available': list(ACTION_MAP.keys())})

    conn = get_db()
    cur = conn.cursor()
    try:
        if action == 'get_tenders':
            return action_get_tenders(params, body, cur)
        if action == 'get_tender':
            return action_get_tender(params, body, cur)

        action_fn = ACTION_MAP[action]
        return action_fn(body, cur)
    finally:
        cur.close()
        conn.close()
