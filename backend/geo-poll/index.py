"""
Business: Опрос LLM (GPT-Search и Perplexity через VseGPT) по запросам tenant.
Сохраняет ответы, парсит упоминания брендов и тональность.
Args: event с httpMethod=POST, body {query_id?: str} — конкретный запрос или все активные
Returns: {polled: int, responses: int, mentions: int}
"""
import json
import os
import re
import hmac
import hashlib
import base64
import time
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
YANDEX_GPT_BASE = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

# 3 нейросети: GPT-4o mini, Perplexity Sonar (с веб-поиском) и YandexGPT.
# Для VseGPT прописываем имя модели; YandexGPT вызывается отдельным API.
PROVIDERS = {
    'openai_gpt4o':     'openai/gpt-4o-mini',
    'perplexity_sonar': 'perplexity/llama-3.1-sonar-large-128k-online',
    'yandex_gpt':       'yandex/yandexgpt',  # маркер; реальный вызов — call_yandex_gpt
}

POSITIVE = {'лучший', 'рекоменд', 'надёжн', 'качествен', 'удобн', 'выгодн',
            'best', 'recommended', 'great', 'excellent', 'top'}
NEGATIVE = {'плохой', 'не рекоменд', 'слабый', 'проблем', 'дорог', 'устарел',
            'bad', 'poor', 'issue', 'avoid', 'worst'}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Cron-Key',
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


class BillingError(Exception):
    """Поднимается, когда у поставщика моделей реально нет денег / баланс исчерпан."""
    pass


class RateLimitError(Exception):
    """Временный лимит частоты запросов (429) или сбой шлюза (502/503). Можно повторить."""
    pass


# Слова, которые однозначно означают проблему с балансом/оплатой (а НЕ rate-limit)
BILLING_WORDS = ('insufficient', 'balance', 'payment required', 'not enough',
                 'недостаточно средств', 'недостаточно баланса', 'пополните',
                 'no credit', 'out of credit')
# Слова про лимит частоты (429), которые НЕ являются проблемой с деньгами
RATE_WORDS = ('rate-limit', 'rate limit', 'too many requests', 'more than',
              'try later', 'try again', 'per 1.0 second', 'per second')


def classify_http_error(code: int, body_text: str) -> Exception:
    """
    Корректно классифицирует ошибку провайдера:
      - реальная нехватка денег → BillingError (останавливаем опрос)
      - rate-limit (429) / шлюз (500/502/503/504) → RateLimitError (повторяем)
      - иначе → RuntimeError
    """
    low = (body_text or '').lower()
    is_billing = any(w in low for w in BILLING_WORDS)
    is_rate = any(w in low for w in RATE_WORDS)

    if is_billing:
        return BillingError(f'HTTP {code}: {body_text[:200]}')
    if code == 429 or is_rate:
        return RateLimitError(f'HTTP {code}: {body_text[:200]}')
    if code in (500, 502, 503, 504):
        return RateLimitError(f'HTTP {code}: {body_text[:200]}')
    # 402 без явных слов про баланс — всё же трактуем как биллинг (Payment Required)
    if code == 402:
        return BillingError(f'HTTP {code}: {body_text[:200]}')
    return RuntimeError(f'HTTP {code}: {body_text[:300]}')


def http_post_json(url: str, headers: dict, payload: dict, timeout: int, retries: int = 2):
    """
    POST с JSON и авто-повтором при RateLimitError (429/502/503).
    Между попытками — пауза, чтобы уложиться в лимит «1 запрос в секунду» у VseGPT.
    """
    data = json.dumps(payload).encode('utf-8')
    last_err = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, method='POST', headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')
            err = classify_http_error(e.code, err_body)
            if isinstance(err, RateLimitError) and attempt < retries:
                # экспоненциальная пауза: 1.5с, 3с …
                time.sleep(1.5 * (attempt + 1))
                last_err = err
                continue
            raise err
        except urllib.error.URLError as e:
            # таймаут/сетевой сбой — тоже пробуем повторить
            last_err = RateLimitError(f'network: {e}')
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise last_err
    if last_err:
        raise last_err
    raise RuntimeError('http_post_json: no response')


def call_yandex_gpt(query: str, language: str = 'ru', timeout: int = 20):
    api_key = os.environ.get('YANDEX_GPT_API_KEY', '')
    folder_id = os.environ.get('YANDEX_GPT_FOLDER_ID', '')
    if not api_key or not folder_id:
        raise RuntimeError('YANDEX_GPT_API_KEY/FOLDER_ID missing')
    sys_text = (
        'Ты — поисковый ассистент. Дай развёрнутый, фактический ответ на запрос. '
        'Указывай конкретные названия брендов, цифры, годы и ссылки на источники.'
        if language == 'ru' else
        'You are a search assistant. Provide a detailed factual answer with specific brand names, numbers, and sources.'
    )
    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt/latest',
        'completionOptions': {'stream': False, 'temperature': 0.3, 'maxTokens': 1500},
        'messages': [
            {'role': 'system', 'text': sys_text},
            {'role': 'user', 'text': query},
        ],
    }
    body = http_post_json(
        YANDEX_GPT_BASE,
        {'Authorization': f'Api-Key {api_key}', 'Content-Type': 'application/json', 'x-folder-id': folder_id},
        payload, timeout,
    )
    alts = (body.get('result') or {}).get('alternatives') or []
    text = (alts[0].get('message') or {}).get('text', '') if alts else ''
    return {
        'text': text,
        'citations': [],
        'model': 'yandex/yandexgpt',
        'usage': (body.get('result') or {}).get('usage', {}),
    }


def call_vsegpt(provider: str, query: str, language: str = 'ru', timeout: int = 20):
    if provider == 'yandex_gpt':
        return call_yandex_gpt(query, language, timeout)
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    if provider not in PROVIDERS:
        raise ValueError(f'unknown provider: {provider}')

    is_search = provider == 'perplexity_sonar'
    sys_prompt = (
        'Ты — поисковый ассистент с доступом к интернету. Дай развёрнутый, фактический ответ на запрос. '
        'Указывай конкретные названия брендов, цифры, годы и ссылки на источники из реального веба.'
        if language == 'ru' and is_search else
        'Ты — поисковый ассистент. Дай развёрнутый, фактический ответ на запрос. '
        'Указывай конкретные названия брендов, цифры, годы и ссылки на источники.'
        if language == 'ru' else
        'You are a search assistant. Provide a detailed factual answer with specific brand names, numbers, and sources.'
    )

    payload = {
        'model': PROVIDERS[provider],
        'messages': [
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': query},
        ],
        'temperature': 0.3,
        'max_tokens': 1500 if is_search else 700,
    }
    body = http_post_json(
        VSEGPT_BASE,
        {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        payload, timeout,
    )
    choice = body['choices'][0]['message']
    return {
        'text': choice.get('content', '') or '',
        'citations': body.get('citations') or choice.get('citations') or [],
        'model': body.get('model', PROVIDERS[provider]),
        'usage': body.get('usage', {}),
    }


def find_mentions(text: str, brands):
    """brands: list of dict {id, name, aliases}"""
    text_lower = text.lower()
    found = []
    for b in brands:
        names = [b['name']] + (b.get('aliases') or [])
        for name in names:
            n = name.strip().lower()
            if not n:
                continue
            try:
                m = re.search(rf'\b{re.escape(n)}\b', text_lower)
            except re.error:
                continue
            if not m:
                continue
            start = max(0, m.start() - 120)
            end = min(len(text), m.end() + 120)
            snippet = text[start:end].strip()
            snip_lc = snippet.lower()
            pos = sum(1 for w in POSITIVE if w in snip_lc)
            neg = sum(1 for w in NEGATIVE if w in snip_lc)
            score = (pos - neg) / max(1, pos + neg)
            if score > 0.2:
                sentiment = 'positive'
            elif score < -0.2:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            found.append({
                'brand_id': b['id'],
                'sentiment': sentiment,
                'score': float(score),
                'position': m.start(),
                'snippet': snippet[:1024],
            })
            break
    return found


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}
    if method != 'POST':
        return resp(405, {'error': 'method_not_allowed'})

    headers = event.get('headers') or {}
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}

    tenant_id = get_tenant(headers)
    if not tenant_id:
        return resp(401, {'error': 'unauthorized'})

    query_id = body.get('query_id')
    # offset/limit для постраничного опроса всех запросов (защита от таймаута Cloud Function)
    offset = int(body.get('offset', 0) or 0)
    # Каждый запрос опрашивается тремя нейросетями последовательно + паузы между ними
    # и возможные повторы при rate-limit. Чтобы уложиться в таймаут функции — по 1 запросу за вызов.
    batch_size = int(body.get('batch_size', 1) or 1)
    batch_size = max(1, min(batch_size, 10))
    try:
        return poll_for_tenant(tenant_id, query_id, offset=offset, batch_size=batch_size)
    except Exception as e:
        # Любая необработанная ошибка возвращается как валидный JSON
        import traceback
        print(f'[poll] FATAL: {e}\n{traceback.format_exc()}')
        return resp(500, {
            'error': 'internal_error',
            'message': (
                f'Внутренняя ошибка опроса: {str(e)[:200]}. '
                'Попробуйте ещё раз через минуту или опросите запросы по одному в разделе «Запросы». '
                'Если повторяется — напишите администратору @Fou9725.'
            ),
        })


# Безопасный лимит общего времени работы функции (Cloud Function timeout ~30 сек).
# 3 провайдера × (вызов + пауза 1.1с + возможный retry) ≈ 15-25 сек на 1 запрос.
MAX_TOTAL_SECONDS = 25


def poll_for_tenant(tenant_id: str, query_id, offset: int = 0, batch_size: int = 5):
    conn = get_db()
    polled, total_resp, total_ment = 0, 0, 0
    errors = []
    started = time.time()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if query_id:
                cur.execute(
                    'SELECT id, text, language FROM geo_tracked_queries '
                    'WHERE tenant_id = %s AND id = %s AND is_active = TRUE',
                    (tenant_id, query_id)
                )
                all_queries = cur.fetchall()
                total_queries = len(all_queries)
                queries = all_queries
            else:
                cur.execute(
                    'SELECT COUNT(*) AS c FROM geo_tracked_queries '
                    'WHERE tenant_id = %s AND is_active = TRUE',
                    (tenant_id,)
                )
                total_queries = int(cur.fetchone()['c'])
                cur.execute(
                    'SELECT q.id, q.text, q.language FROM geo_tracked_queries q '
                    'LEFT JOIN LATERAL ('
                    '  SELECT MAX(polled_at) AS last_polled '
                    '  FROM geo_llm_responses r WHERE r.query_id = q.id'
                    ') lp ON TRUE '
                    'WHERE q.tenant_id = %s AND q.is_active = TRUE '
                    'ORDER BY COALESCE(lp.last_polled, q.created_at) ASC, q.id ASC '
                    'LIMIT %s OFFSET %s',
                    (tenant_id, batch_size, offset)
                )
                queries = cur.fetchall()

            cur.execute(
                'SELECT id, name, aliases, is_own FROM geo_brands WHERE tenant_id = %s',
                (tenant_id,)
            )
            brands = [{
                'id': str(r['id']), 'name': r['name'],
                'aliases': r['aliases'] or [], 'is_own': r['is_own'],
            } for r in cur.fetchall()]

        if total_queries == 0:
            return resp(200, {
                'polled': 0, 'responses': 0, 'mentions': 0,
                'total': 0, 'next_offset': None,
                'note': 'no_active_queries',
            })

        billing_blocked = False
        provider_list = list(PROVIDERS.keys())
        for q in queries:
            if billing_blocked:
                break
            # Останавливаемся если приближается таймаут — клиент сам дозапросит остаток
            if time.time() - started > MAX_TOTAL_SECONDS:
                print(f'[poll] time budget exceeded, stopping at polled={polled}')
                break
            qid = str(q['id'])
            any_provider_ok = False
            for pi, provider in enumerate(provider_list):
                # Пауза между провайдерами: VseGPT ограничивает ~1 запрос в секунду
                if pi > 0:
                    time.sleep(1.1)
                try:
                    res = call_vsegpt(provider, q['text'], q['language'])
                except BillingError as be:
                    msg = str(be)[:200]
                    print(f'[poll] BILLING {provider} {qid}: {msg}')
                    billing_blocked = True
                    errors.append({'query_id': qid, 'provider': provider, 'error': msg})
                    break
                except RateLimitError as rl:
                    # Временный лимит частоты / сбой шлюза — НЕ блокируем опрос, просто пропускаем провайдера
                    msg = str(rl)[:200]
                    print(f'[poll] RATELIMIT {provider} {qid}: {msg}')
                    errors.append({'query_id': qid, 'provider': provider,
                                   'error': f'Временный лимит/сбой провайдера: {msg}'})
                    continue
                except Exception as e:
                    msg = str(e)[:200]
                    print(f'[poll] {provider} {qid}: {msg}')
                    errors.append({'query_id': qid, 'provider': provider, 'error': msg})
                    continue

                any_provider_ok = True
                try:
                    with conn:
                        with conn.cursor(cursor_factory=RealDictCursor) as cur:
                            cur.execute(
                                'INSERT INTO geo_llm_responses '
                                '(tenant_id, query_id, provider, model, raw_text, citations, meta) '
                                'VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb) RETURNING id',
                                (tenant_id, qid, provider, res['model'], res['text'],
                                 json.dumps(res['citations']), json.dumps({'usage': res['usage']}))
                            )
                            rid = str(cur.fetchone()['id'])
                            total_resp += 1

                            mentions = find_mentions(res['text'], brands)
                            for m in mentions:
                                cur.execute(
                                    'INSERT INTO geo_mentions '
                                    '(tenant_id, response_id, brand_id, sentiment, sentiment_score, position, snippet) '
                                    'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                                    (tenant_id, rid, m['brand_id'], m['sentiment'],
                                     m['score'], m['position'], m['snippet'])
                                )
                                total_ment += 1
                except Exception as db_err:
                    print(f'[poll] db save error {qid}: {db_err}')
                    errors.append({'query_id': qid, 'provider': provider, 'error': f'db: {str(db_err)[:160]}'})

            if any_provider_ok:
                # last_polled вычисляется при чтении через MAX(polled_at) в geo_llm_responses,
                # отдельной колонки нет — UPDATE не нужен.
                polled += 1

        next_offset = None
        if not query_id and not billing_blocked:
            advanced = offset + len(queries)
            if advanced < total_queries:
                next_offset = advanced

        # Если ничего не опросили и причина — биллинг, отдаём 402 с человекочитаемой подсказкой
        if billing_blocked and polled == 0:
            return resp(402, {
                'error': 'provider_billing',
                'message': (
                    'У поставщика моделей (VseGPT) недостаточно средств или превышен лимит. '
                    'Пополните баланс в личном кабинете vsegpt.ru или подождите автоматического сброса дневного лимита, '
                    'затем запустите опрос снова. Если проблема повторяется — напишите администратору @Fou9725.'
                ),
                'polled': 0,
                'responses': 0,
                'mentions': 0,
                'total': total_queries,
                'next_offset': None,
                'errors': errors[:10],
            })

        note = 'billing_blocked' if billing_blocked else None
        return resp(200, {
            'polled': polled,
            'responses': total_resp,
            'mentions': total_ment,
            'total': total_queries,
            'processed_in_batch': len(queries),
            'next_offset': next_offset,
            'errors': errors[:10],
            'note': note,
        })
    finally:
        conn.close()