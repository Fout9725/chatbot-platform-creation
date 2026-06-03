"""
Business: CRUD отслеживаемых поисковых запросов GEO-платформы + ИИ-помощник (генератор, импорт, аналитика).
Args: event с httpMethod, headers (X-Auth-Token), body или queryStringParameters (action)
Returns: HTTP-ответ со списком запросов / результатом операции / сгенерированными предложениями
"""
import json
import os
import hmac
import hashlib
import base64
import time
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
DEFAULT_MODEL = 'openai/gpt-4o-mini'

# Категории и интенты, которые понимает фронт. Используются и при ИИ-генерации.
ALLOWED_CATEGORIES = {'commercial', 'comparison', 'informational', 'branded', 'navigational', 'local', 'other'}
ALLOWED_INTENTS = {'buy', 'choose', 'compare', 'learn', 'find', 'review', 'other'}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def resp(status, body):
    return {'statusCode': status, 'headers': cors_headers(), 'isBase64Encoded': False,
            'body': json.dumps(body, ensure_ascii=False, default=str)}


def b64url_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def jwt_decode(token: str, secret: str):
    try:
        h, p, s = token.split('.')
        sig_input = f'{h}.{p}'.encode()
        expected = hmac.new(secret.encode(), sig_input, hashlib.sha256).digest()
        if not hmac.compare_digest(b64url(expected), s):
            return None
        payload = json.loads(b64url_decode(p))
        if payload.get('exp', 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def get_tenant(headers: dict):
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    payload = jwt_decode(token, os.environ.get('GEO_JWT_SECRET', 'dev-secret'))
    return payload.get('tid') if payload else None


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _row_id(row):
    """Достаёт id из строки независимо от типа курсора (dict или tuple)."""
    if row is None:
        return None
    try:
        return str(row['id'])
    except (TypeError, KeyError, IndexError):
        return str(row[0])


def resolve_project(cur, tenant_id: str, project_id):
    """Возвращает валидный project_id (переданный или дефолтный), гарантирует наличие проекта."""
    if project_id:
        cur.execute('SELECT id FROM geo_projects WHERE tenant_id = %s AND id = %s',
                    (tenant_id, project_id))
        rid = _row_id(cur.fetchone())
        if rid:
            return rid
    cur.execute(
        'SELECT id FROM geo_projects WHERE tenant_id = %s ORDER BY is_default DESC, created_at ASC LIMIT 1',
        (tenant_id,)
    )
    rid = _row_id(cur.fetchone())
    if rid:
        return rid
    cur.execute(
        'INSERT INTO geo_projects (tenant_id, name, is_default) VALUES (%s, %s, TRUE) RETURNING id',
        (tenant_id, 'Основной проект')
    )
    return _row_id(cur.fetchone())


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}

    headers = event.get('headers') or {}
    tenant_id = get_tenant(headers)
    if not tenant_id:
        return resp(401, {'error': 'unauthorized'})

    qs = event.get('queryStringParameters') or {}
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}

    action = qs.get('action') or body.get('action')
    project_id = qs.get('project_id') or body.get('project_id')

    if method == 'GET':
        if action == 'competitor_gaps':
            return competitor_gaps(tenant_id, int(qs.get('days', '14')), project_id)
        return list_queries(tenant_id, int(qs.get('days', '14')), project_id)
    if method == 'POST':
        if action == 'suggest':
            return suggest_queries(tenant_id, body, project_id)
        if action == 'bulk_create':
            return bulk_create_queries(tenant_id, body, project_id)
        return create_query(tenant_id, body, project_id)
    if method == 'PUT':
        return update_query(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_query(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


# ------------------------- LIST с метриками -------------------------

def list_queries(tenant_id: str, days: int = 14, project_id=None):
    """
    Отдаёт запросы + per-query метрики за `days` дней:
      - sov: доля голоса бренда по этому запросу
      - own_mentions / competitor_mentions
      - top_competitor: кто чаще всего упоминается вместо нас
      - trend: '+', '-', '=' (сравнение с предыдущим окном такой же длины)
    """
    days = max(1, min(int(days or 14), 90))
    conn = get_db()
    try:
        with conn:
          with conn.cursor(cursor_factory=RealDictCursor) as cur:
            pid = resolve_project(cur, tenant_id, project_id)
            cur.execute(
                """
                SELECT q.id, q.text, q.language, q.is_active, q.category, q.intent, q.notes, q.source,
                       q.created_at,
                       (SELECT MAX(polled_at) FROM geo_llm_responses r WHERE r.query_id = q.id) AS last_polled,
                       (SELECT COUNT(*) FROM geo_llm_responses r WHERE r.query_id = q.id) AS responses_count
                FROM geo_tracked_queries q
                WHERE q.tenant_id = %s AND q.project_id = %s
                ORDER BY q.is_active DESC, q.created_at DESC
                """,
                (tenant_id, pid)
            )
            rows = cur.fetchall()

            # Метрики за текущее окно (только бренды этого проекта)
            cur.execute(
                """
                SELECT r.query_id,
                       SUM(CASE WHEN b.is_own THEN 1 ELSE 0 END) AS own_m,
                       SUM(CASE WHEN b.is_own THEN 0 ELSE 1 END) AS comp_m,
                       COUNT(*) AS total_m
                FROM geo_mentions m
                JOIN geo_llm_responses r ON r.id = m.response_id
                JOIN geo_brands b ON b.id = m.brand_id
                WHERE m.tenant_id = %s AND b.project_id = %s
                  AND r.polled_at >= NOW() - (%s || ' days')::interval
                GROUP BY r.query_id
                """,
                (tenant_id, pid, days)
            )
            cur_metrics = {str(r['query_id']): r for r in cur.fetchall()}

            # Метрики за предыдущее окно (для тренда)
            cur.execute(
                """
                SELECT r.query_id,
                       SUM(CASE WHEN b.is_own THEN 1 ELSE 0 END) AS own_m,
                       COUNT(*) AS total_m
                FROM geo_mentions m
                JOIN geo_llm_responses r ON r.id = m.response_id
                JOIN geo_brands b ON b.id = m.brand_id
                WHERE m.tenant_id = %s AND b.project_id = %s
                  AND r.polled_at >= NOW() - (%s || ' days')::interval
                  AND r.polled_at <  NOW() - (%s || ' days')::interval
                GROUP BY r.query_id
                """,
                (tenant_id, pid, days * 2, days)
            )
            prev_metrics = {str(r['query_id']): r for r in cur.fetchall()}

            # Топ-конкурент по каждому запросу
            cur.execute(
                """
                SELECT r.query_id, b.name AS brand_name, COUNT(*) AS cnt
                FROM geo_mentions m
                JOIN geo_llm_responses r ON r.id = m.response_id
                JOIN geo_brands b ON b.id = m.brand_id
                WHERE m.tenant_id = %s AND b.project_id = %s
                  AND b.is_own = FALSE
                  AND r.polled_at >= NOW() - (%s || ' days')::interval
                GROUP BY r.query_id, b.name
                ORDER BY r.query_id, cnt DESC
                """,
                (tenant_id, pid, days)
            )
            top_comp = {}
            for r in cur.fetchall():
                qid = str(r['query_id'])
                if qid not in top_comp:
                    top_comp[qid] = {'name': r['brand_name'], 'count': int(r['cnt'])}

        out = []
        for r in rows:
            qid = str(r['id'])
            cur_m = cur_metrics.get(qid) or {'own_m': 0, 'comp_m': 0, 'total_m': 0}
            prev_m = prev_metrics.get(qid) or {'own_m': 0, 'total_m': 0}

            own = int(cur_m['own_m'] or 0)
            comp = int(cur_m['comp_m'] or 0)
            total = int(cur_m['total_m'] or 0)
            sov = round(own / total * 100, 1) if total else 0

            prev_total = int(prev_m['total_m'] or 0)
            prev_sov = (int(prev_m['own_m'] or 0) / prev_total * 100) if prev_total else 0
            if prev_total == 0 and total == 0:
                trend = '='
            elif abs(sov - prev_sov) < 2:
                trend = '='
            else:
                trend = '+' if sov > prev_sov else '-'

            out.append({
                'id': qid, 'text': r['text'], 'language': r['language'],
                'is_active': r['is_active'],
                'category': r['category'], 'intent': r['intent'], 'notes': r['notes'],
                'source': r['source'] or 'manual',
                'created_at': r['created_at'].isoformat(),
                'last_polled': r['last_polled'].isoformat() if r['last_polled'] else None,
                'responses_count': int(r['responses_count'] or 0),
                'metrics': {
                    'own_mentions': own,
                    'competitor_mentions': comp,
                    'total_mentions': total,
                    'sov': sov,
                    'trend': trend,
                    'sov_delta': round(sov - prev_sov, 1),
                    'top_competitor': top_comp.get(qid),
                    'window_days': days,
                },
            })
        return resp(200, {'queries': out})
    finally:
        conn.close()


# ------------------------- CRUD -------------------------

def _normalize_category(cat):
    if not cat:
        return None
    cat = str(cat).strip().lower()
    return cat if cat in ALLOWED_CATEGORIES else None


def _normalize_intent(it):
    if not it:
        return None
    it = str(it).strip().lower()
    return it if it in ALLOWED_INTENTS else None


def create_query(tenant_id: str, body: dict, project_id=None):
    text = (body.get('text') or '').strip()
    if not text:
        return resp(400, {'error': 'text_required'})
    if len(text) > 1000:
        return resp(400, {'error': 'text_too_long'})
    language = body.get('language') or 'ru'
    is_active = bool(body.get('is_active', True))
    category = _normalize_category(body.get('category'))
    intent = _normalize_intent(body.get('intent'))
    notes = body.get('notes')
    source = (body.get('source') or 'manual').strip()[:32]

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                pid = resolve_project(cur, tenant_id, project_id)
                cur.execute(
                    'INSERT INTO geo_tracked_queries '
                    '(tenant_id, project_id, text, language, is_active, category, intent, notes, source) '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at',
                    (tenant_id, pid, text, language, is_active, category, intent, notes, source)
                )
                row = cur.fetchone()
        return resp(200, {'query': {
            'id': str(row['id']), 'text': text, 'language': language,
            'is_active': is_active, 'category': category, 'intent': intent,
            'notes': notes, 'source': source,
            'created_at': row['created_at'].isoformat(),
            'last_polled': None, 'responses_count': 0,
            'metrics': None,
        }})
    finally:
        conn.close()


def update_query(tenant_id: str, qid: str, body: dict):
    if not qid:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []
    if 'text' in body:
        fields.append('text = %s'); values.append((body['text'] or '').strip())
    if 'language' in body:
        fields.append('language = %s'); values.append(body['language'])
    if 'is_active' in body:
        fields.append('is_active = %s'); values.append(bool(body['is_active']))
    if 'category' in body:
        fields.append('category = %s'); values.append(_normalize_category(body['category']))
    if 'intent' in body:
        fields.append('intent = %s'); values.append(_normalize_intent(body['intent']))
    if 'notes' in body:
        fields.append('notes = %s'); values.append(body['notes'])
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, qid])

    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_tracked_queries SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_query(tenant_id: str, qid: str):
    if not qid:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM geo_mentions WHERE tenant_id = %s AND response_id IN '
                    '(SELECT id FROM geo_llm_responses WHERE query_id = %s)',
                    (tenant_id, qid)
                )
                cur.execute('DELETE FROM geo_llm_responses WHERE tenant_id = %s AND query_id = %s', (tenant_id, qid))
                cur.execute('DELETE FROM geo_tracked_queries WHERE tenant_id = %s AND id = %s', (tenant_id, qid))
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


# ------------------------- BULK CREATE -------------------------

def bulk_create_queries(tenant_id: str, body: dict, project_id=None):
    """
    Принимает items: [{text, language?, category?, intent?, notes?, source?}, ...]
    Или просто массив строк: items: ['запрос 1', 'запрос 2', ...]
    Дубликаты (одинаковый text) пропускает.
    """
    raw_items = body.get('items') or []
    if not isinstance(raw_items, list) or not raw_items:
        return resp(400, {'error': 'items_required'})
    if len(raw_items) > 200:
        return resp(400, {'error': 'too_many_items', 'message': 'Максимум 200 запросов за раз'})

    items = []
    for it in raw_items:
        if isinstance(it, str):
            text = it.strip()
            if text:
                items.append({'text': text})
        elif isinstance(it, dict):
            text = (it.get('text') or '').strip()
            if text:
                items.append({
                    'text': text[:1000],
                    'language': it.get('language') or 'ru',
                    'category': _normalize_category(it.get('category')),
                    'intent': _normalize_intent(it.get('intent')),
                    'notes': it.get('notes'),
                    'source': (it.get('source') or 'bulk').strip()[:32],
                })

    if not items:
        return resp(400, {'error': 'no_valid_items'})

    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                pid = resolve_project(cur, tenant_id, project_id)
                # Существующие тексты в этом проекте — чтобы не дублировать
                cur.execute(
                    'SELECT LOWER(text) FROM geo_tracked_queries WHERE tenant_id = %s AND project_id = %s',
                    (tenant_id, pid)
                )
                existing = {row[0] for row in cur.fetchall()}

                created = 0
                skipped = 0
                seen_in_batch = set()
                for it in items:
                    key = it['text'].lower()
                    if key in existing or key in seen_in_batch:
                        skipped += 1
                        continue
                    seen_in_batch.add(key)
                    cur.execute(
                        'INSERT INTO geo_tracked_queries '
                        '(tenant_id, project_id, text, language, is_active, category, intent, notes, source) '
                        'VALUES (%s, %s, %s, %s, TRUE, %s, %s, %s, %s)',
                        (tenant_id, pid, it['text'], it.get('language', 'ru'),
                         it.get('category'), it.get('intent'), it.get('notes'),
                         it.get('source', 'bulk'))
                    )
                    created += 1
        return resp(200, {'created': created, 'skipped': skipped, 'total': len(items)})
    finally:
        conn.close()


# ------------------------- AI SUGGEST -------------------------

def _fetch_tenant_context(tenant_id: str, project_id=None) -> dict:
    """Собираем контекст для ИИ: бренды (свои/конкуренты) + примеры существующих запросов проекта."""
    conn = get_db()
    try:
        with conn:
          with conn.cursor(cursor_factory=RealDictCursor) as cur:
            pid = resolve_project(cur, tenant_id, project_id)
            cur.execute(
                'SELECT name, aliases, is_own FROM geo_brands '
                'WHERE tenant_id = %s AND project_id = %s ORDER BY is_own DESC',
                (tenant_id, pid)
            )
            brands = cur.fetchall()
            cur.execute(
                'SELECT text, category FROM geo_tracked_queries '
                'WHERE tenant_id = %s AND project_id = %s ORDER BY created_at DESC LIMIT 20',
                (tenant_id, pid)
            )
            existing = cur.fetchall()
        own = [b for b in brands if b['is_own']]
        comps = [b for b in brands if not b['is_own']]
        return {
            'own_brand': own[0] if own else None,
            'competitors': comps,
            'existing_queries': [q['text'] for q in existing],
        }
    finally:
        conn.close()


def _call_vsegpt(messages: list, model: str = DEFAULT_MODEL, timeout: int = 60) -> str:
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY not configured')
    payload = {
        'model': model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 2500,
        'response_format': {'type': 'json_object'},
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        VSEGPT_BASE, data=data, method='POST',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='replace')[:300]
        raise RuntimeError(f'LLM HTTP {e.code}: {err}')
    return body['choices'][0]['message']['content'] or ''


def suggest_queries(tenant_id: str, body: dict, project_id=None):
    """
    ИИ-генератор. Анализирует бренд и предлагает 15-25 запросов, которые реальные клиенты
    задают LLM в этой нише. Запросы НЕ записываются в БД — пользователь сам выбирает и добавляет.
    Принимает (опционально):
      - industry: ниша/отрасль (если бренда нет в системе)
      - region: гео (по умолчанию Россия)
      - count: 10-30, по умолчанию 20
      - focus: 'all' | 'commercial' | 'comparison' | 'informational' | 'branded'
      - extra_context: любые пожелания (свободный текст)
    """
    ctx = _fetch_tenant_context(tenant_id, project_id)
    own = ctx['own_brand']
    industry = (body.get('industry') or '').strip()
    region = (body.get('region') or 'Россия').strip()
    count = max(10, min(int(body.get('count') or 20), 30))
    focus = body.get('focus') or 'all'
    extra = (body.get('extra_context') or '').strip()

    if not own and not industry:
        return resp(400, {
            'error': 'no_context',
            'message': 'Сначала добавьте свой бренд в разделе «Бренды» или укажите нишу для генерации.'
        })

    brand_block = ''
    if own:
        aliases = ', '.join(own['aliases']) if own['aliases'] else '—'
        brand_block = f'Бренд клиента: «{own["name"]}» (алиасы: {aliases}).'
    comp_block = ''
    if ctx['competitors']:
        names = ', '.join(f'«{c["name"]}»' for c in ctx['competitors'][:10])
        comp_block = f'Известные конкуренты: {names}.'
    existing_block = ''
    if ctx['existing_queries']:
        sample = '\n'.join(f'- {q}' for q in ctx['existing_queries'][:15])
        existing_block = f'Уже отслеживаемые запросы (НЕ дублируй):\n{sample}'

    focus_map = {
        'commercial': 'Сделай упор на коммерческие запросы (где купить, заказать, цена, доставка).',
        'comparison': 'Сделай упор на сравнения (X vs Y, что лучше, рейтинг, топ).',
        'informational': 'Сделай упор на информационные запросы (как выбрать, что это такое, инструкция).',
        'branded': 'Сделай упор на брендовые и около-брендовые запросы (отзывы, аналоги, обзор).',
        'all': 'Сделай разный микс: коммерческие, сравнения, информационные и брендовые — пропорционально.',
    }
    focus_hint = focus_map.get(focus, focus_map['all'])

    industry_block = f'Ниша/отрасль: {industry}.' if industry else ''
    extra_block = f'Дополнительный контекст от клиента: {extra}' if extra else ''

    system_prompt = (
        'Ты — эксперт по GEO/AEO (Generative Engine Optimization) и анализу поисковых интентов. '
        'Твоя задача — для бренда клиента сгенерировать список РЕАЛИСТИЧНЫХ запросов, '
        'которые живые люди (потенциальные клиенты) задают нейросетям (ChatGPT, Perplexity, YandexGPT) '
        'в процессе выбора товара/услуги. Цель — попасть в нейровыдачу с упоминанием бренда. '
        'Формулируй запросы естественным разговорным языком, как пишут люди (длинные хвосты, вопросы, '
        'указание гео/задачи). Избегай SEO-кликбейта типа «купить недорого». '
        'НЕ упоминай бренд клиента в коммерческих и сравнительных запросах напрямую — иначе LLM не сможет '
        '«самостоятельно» его рекомендовать. Брендовые запросы — отдельная категория.'
    )

    user_prompt = f'''
{brand_block}
{industry_block}
{comp_block}
Регион: {region}.
{existing_block}

{focus_hint}
{extra_block}

Сгенерируй ровно {count} разнообразных запросов на русском языке.

Верни СТРОГО JSON в формате:
{{
  "queries": [
    {{
      "text": "формулировка запроса как пишет человек",
      "category": "commercial" | "comparison" | "informational" | "branded" | "local",
      "intent": "buy" | "compare" | "choose" | "learn" | "find" | "review",
      "reason": "Короткое объяснение: почему этот запрос важен и как он поможет LLM упомянуть бренд (1-2 предложения)"
    }}
  ]
}}
'''.strip()

    try:
        raw = _call_vsegpt(
            [{'role': 'system', 'content': system_prompt},
             {'role': 'user', 'content': user_prompt}],
            model=DEFAULT_MODEL,
        )
    except Exception as e:
        msg = str(e)
        low = msg.lower()
        if any(w in low for w in ('insufficient', 'balance', 'payment', '402', 'недостаточно')):
            return resp(402, {
                'error': 'billing_blocked',
                'message': 'У провайдера моделей закончились средства — пополните vsegpt.ru.',
            })
        return resp(500, {'error': 'llm_error', 'message': f'Не удалось сгенерировать: {msg[:200]}'})

    try:
        parsed = json.loads(raw)
        items = parsed.get('queries') or []
    except Exception:
        return resp(500, {'error': 'bad_llm_response', 'message': 'Модель вернула некорректный JSON.'})

    # Нормализуем
    suggestions = []
    seen = set()
    own_lower = (own['name'].lower() if own else '')
    for it in items:
        if not isinstance(it, dict):
            continue
        text = (it.get('text') or '').strip()
        if not text or len(text) > 500:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        suggestions.append({
            'text': text,
            'category': _normalize_category(it.get('category')) or 'informational',
            'intent': _normalize_intent(it.get('intent')) or 'learn',
            'reason': (it.get('reason') or '').strip()[:300],
            'mentions_own': bool(own_lower and own_lower in key),
        })

    return resp(200, {
        'suggestions': suggestions,
        'context': {
            'own_brand': own['name'] if own else None,
            'competitors_count': len(ctx['competitors']),
            'industry': industry or None,
            'region': region,
        },
    })


# ------------------------- COMPETITOR GAPS -------------------------

def competitor_gaps(tenant_id: str, days: int = 14, project_id=None):
    """
    Анализ «где конкуренты выигрывают, а нас нет».
    Возвращает топ-запросы, где own_mentions == 0, но competitor_mentions > 0.
    """
    days = max(1, min(int(days or 14), 90))
    conn = get_db()
    try:
        with conn:
          with conn.cursor(cursor_factory=RealDictCursor) as cur:
            pid = resolve_project(cur, tenant_id, project_id)
            cur.execute(
                """
                SELECT q.id, q.text, q.category, q.intent,
                       COUNT(DISTINCT r.id) AS responses,
                       SUM(CASE WHEN b.is_own THEN 1 ELSE 0 END) AS own_m,
                       SUM(CASE WHEN b.is_own THEN 0 ELSE 1 END) AS comp_m
                FROM geo_tracked_queries q
                LEFT JOIN geo_llm_responses r
                  ON r.query_id = q.id AND r.polled_at >= NOW() - (%s || ' days')::interval
                LEFT JOIN geo_mentions m ON m.response_id = r.id
                LEFT JOIN geo_brands b ON b.id = m.brand_id
                WHERE q.tenant_id = %s AND q.project_id = %s
                GROUP BY q.id
                HAVING COUNT(DISTINCT r.id) > 0
                ORDER BY (SUM(CASE WHEN b.is_own THEN 0 ELSE 1 END))::int DESC,
                         (SUM(CASE WHEN b.is_own THEN 1 ELSE 0 END))::int ASC
                LIMIT 50
                """,
                (days, tenant_id, pid)
            )
            rows = cur.fetchall()

            # Для каждого «дырявого» запроса вытаскиваем кто выигрывает
            gap_qids = [str(r['id']) for r in rows if int(r['own_m'] or 0) == 0 and int(r['comp_m'] or 0) > 0]
            top_brands_per_query = {}
            if gap_qids:
                cur.execute(
                    """
                    SELECT r.query_id, b.name AS brand_name, COUNT(*) AS cnt
                    FROM geo_mentions m
                    JOIN geo_llm_responses r ON r.id = m.response_id
                    JOIN geo_brands b ON b.id = m.brand_id
                    WHERE m.tenant_id = %s AND b.project_id = %s
                      AND b.is_own = FALSE
                      AND r.polled_at >= NOW() - (%s || ' days')::interval
                      AND r.query_id::text = ANY(%s)
                    GROUP BY r.query_id, b.name
                    ORDER BY r.query_id, cnt DESC
                    """,
                    (tenant_id, pid, days, gap_qids)
                )
                for r in cur.fetchall():
                    qid = str(r['query_id'])
                    top_brands_per_query.setdefault(qid, []).append(
                        {'name': r['brand_name'], 'count': int(r['cnt'])}
                    )

        gaps = []
        weak = []
        for r in rows:
            qid = str(r['id'])
            own = int(r['own_m'] or 0)
            comp = int(r['comp_m'] or 0)
            entry = {
                'id': qid,
                'text': r['text'],
                'category': r['category'],
                'intent': r['intent'],
                'responses': int(r['responses']),
                'own_mentions': own,
                'competitor_mentions': comp,
                'top_competitors': top_brands_per_query.get(qid, [])[:3],
            }
            if own == 0 and comp > 0:
                gaps.append(entry)
            elif comp > own and own > 0:
                weak.append(entry)

        return resp(200, {
            'gaps': gaps[:20],            # совсем нас нет
            'weak_spots': weak[:20],      # есть, но проигрываем
            'window_days': days,
        })
    finally:
        conn.close()