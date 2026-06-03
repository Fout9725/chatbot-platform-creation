"""
Business: CRUD публикаций (URL опубликованных материалов) и проверка попадания в LLM-ответы.
Args: event с httpMethod (GET/POST/PUT/DELETE), action=check, headers (X-Auth-Token), body, queryStringParameters
Returns: HTTP-ответ со списком публикаций, операцией или результатом проверки индексации
"""
import json
import os
import hmac
import hashlib
import base64
import time
import urllib.parse
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
YANDEX_GPT_BASE = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

# Search-enabled LLM с реальным доступом в интернет.
# Обычные gpt-4o-mini и YandexGPT не умеют гуглить → ничего не находят.
SEARCH_LLM_PROVIDERS = {
    'perplexity_sonar': 'perplexity/sonar',  # актуальная модель с веб-поиском (старые *-online отключены)
    'gpt4o_search': 'openai/gpt-4o-search-preview',
}

USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
)


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


def extract_domain(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).hostname or ''
        return host.replace('www.', '').lower()
    except Exception:
        return ''


def call_yandex_gpt(query: str, timeout: int = 60):
    api_key = os.environ.get('YANDEX_GPT_API_KEY', '')
    folder_id = os.environ.get('YANDEX_GPT_FOLDER_ID', '')
    if not api_key or not folder_id:
        raise RuntimeError('YANDEX_GPT_API_KEY or YANDEX_GPT_FOLDER_ID missing')
    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt/latest',
        'completionOptions': {'stream': False, 'temperature': 0.3, 'maxTokens': 1500},
        'messages': [
            {'role': 'system', 'text': 'Ответь на вопрос с указанием конкретных источников, брендов и ссылок.'},
            {'role': 'user', 'text': query},
        ],
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        YANDEX_GPT_BASE, data=data, method='POST',
        headers={'Authorization': f'Api-Key {api_key}', 'Content-Type': 'application/json', 'x-folder-id': folder_id},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'YandexGPT HTTP {e.code}: {err_body[:300]}')
    alts = (body.get('result') or {}).get('alternatives') or []
    text = (alts[0].get('message') or {}).get('text', '') if alts else ''
    return {'text': text, 'citations': []}


def call_vsegpt(provider: str, query: str, timeout: int = 60):
    if provider == 'yandex_gpt':
        return call_yandex_gpt(query, timeout)
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    payload = {
        'model': PROVIDERS[provider],
        'messages': [
            {'role': 'system', 'content': 'Ответь на вопрос с указанием конкретных источников и ссылок.'},
            {'role': 'user', 'content': query},
        ],
        'temperature': 0.3,
        'max_tokens': 1500,
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
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'VseGPT HTTP {e.code}: {err_body[:300]}')
    choice = body['choices'][0]['message']
    return {
        'text': choice.get('content', '') or '',
        'citations': body.get('citations') or choice.get('citations') or [],
    }


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

    action = qs.get('action')
    project_id = qs.get('project_id') or body.get('project_id')

    if method == 'GET':
        if qs.get('id') and action == 'checks':
            return list_checks(tenant_id, qs['id'])
        return list_publications(tenant_id, project_id)
    if method == 'POST':
        if action == 'check':
            return check_publication(tenant_id, qs.get('id', ''))
        return create_publication(tenant_id, body, project_id)
    if method == 'PUT':
        return update_publication(tenant_id, qs.get('id', ''), body)
    if method == 'DELETE':
        return delete_publication(tenant_id, qs.get('id', ''))
    return resp(405, {'error': 'method_not_allowed'})


def resolve_project(cur, tenant_id: str, project_id):
    """Возвращает валидный project_id (переданный или дефолтный), гарантирует наличие проекта."""
    if project_id:
        cur.execute('SELECT id FROM geo_projects WHERE tenant_id = %s AND id = %s',
                    (tenant_id, project_id))
        row = cur.fetchone()
        if row:
            return str(row['id'])
    cur.execute(
        'SELECT id FROM geo_projects WHERE tenant_id = %s ORDER BY is_default DESC, created_at ASC LIMIT 1',
        (tenant_id,)
    )
    row = cur.fetchone()
    if row:
        return str(row['id'])
    cur.execute(
        'INSERT INTO geo_projects (tenant_id, name, is_default) VALUES (%s, %s, TRUE) RETURNING id',
        (tenant_id, 'Основной проект')
    )
    return str(cur.fetchone()['id'])


def list_publications(tenant_id: str, project_id=None):
    conn = get_db()
    try:
        with conn:
          with conn.cursor(cursor_factory=RealDictCursor) as cur:
            proj_id = resolve_project(cur, tenant_id, project_id)
            cur.execute(
                """
                SELECT p.id, p.title, p.url, p.extra_urls, p.platform, p.status, p.published_at,
                       p.last_check_at, p.last_check_found, p.notes,
                       p.draft_id, p.query_id, q.text AS query_text,
                       p.created_at, p.updated_at
                FROM geo_publications_v2 p
                LEFT JOIN geo_tracked_queries q ON q.id = p.query_id AND q.tenant_id = p.tenant_id
                WHERE p.tenant_id = %s AND p.project_id = %s
                ORDER BY p.created_at DESC
                """,
                (tenant_id, proj_id)
            )
            rows = cur.fetchall()

            cur.execute(
                """
                SELECT DISTINCT ON (publication_id, provider)
                       publication_id, provider, found, checked_at
                FROM geo_publication_checks_v2
                WHERE tenant_id = %s
                ORDER BY publication_id, provider, checked_at DESC
                """,
                (tenant_id,)
            )
            latest = cur.fetchall()
        per_pub = {}
        for c in latest:
            pid = str(c['publication_id'])
            per_pub.setdefault(pid, {})[c['provider']] = {
                'found': bool(c['found']),
                'checked_at': c['checked_at'].isoformat() if c['checked_at'] else None,
            }
        return resp(200, {'publications': [
            {**serialize(r), 'providers': per_pub.get(str(r['id']), {})} for r in rows
        ]})
    finally:
        conn.close()


def serialize(r):
    extra = r.get('extra_urls') or []
    if isinstance(extra, str):
        try:
            extra = json.loads(extra)
        except Exception:
            extra = []
    urls = [r['url']] + [u for u in extra if u]
    return {
        'id': str(r['id']), 'title': r['title'], 'url': r['url'],
        'urls': urls,
        'extra_urls': extra,
        'platform': r['platform'], 'status': r['status'],
        'published_at': r['published_at'].isoformat() if r['published_at'] else None,
        'last_check_at': r['last_check_at'].isoformat() if r['last_check_at'] else None,
        'last_check_found': r['last_check_found'],
        'notes': r['notes'],
        'draft_id': str(r['draft_id']) if r['draft_id'] else None,
        'query_id': str(r['query_id']) if r['query_id'] else None,
        'query_text': r.get('query_text'),
        'created_at': r['created_at'].isoformat(),
        'updated_at': r['updated_at'].isoformat(),
    }


def normalize_urls(body: dict):
    raw = body.get('urls')
    out = []
    if isinstance(raw, list):
        for u in raw:
            if isinstance(u, str) and u.strip():
                out.append(u.strip())
    single = (body.get('url') or '').strip()
    if single and single not in out:
        out.insert(0, single)
    seen, dedup = set(), []
    for u in out:
        if u not in seen and (u.startswith('http://') or u.startswith('https://')):
            seen.add(u)
            dedup.append(u)
    return dedup


def create_publication(tenant_id: str, body: dict, project_id=None):
    title = (body.get('title') or '').strip()
    urls = normalize_urls(body)
    if not title or not urls:
        return resp(400, {'error': 'title_and_url_required'})

    url = urls[0]
    extra_urls = urls[1:]
    platform = (body.get('platform') or extract_domain(url) or '').strip() or None
    draft_id = body.get('draft_id') or None
    query_id = body.get('query_id') or None
    published_at = body.get('published_at')
    notes = body.get('notes')
    status = body.get('status') or 'live'

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                proj_id = resolve_project(cur, tenant_id, project_id)
                # если публикация из черновика — берём проект черновика
                if draft_id:
                    cur.execute('SELECT project_id FROM geo_drafts WHERE tenant_id = %s AND id = %s',
                                (tenant_id, draft_id))
                    dr = cur.fetchone()
                    if dr and dr['project_id']:
                        proj_id = str(dr['project_id'])
                cur.execute(
                    """
                    INSERT INTO geo_publications_v2
                      (tenant_id, project_id, draft_id, query_id, title, url, extra_urls, platform, published_at, status, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s)
                    RETURNING id, created_at, updated_at, last_check_at, last_check_found, published_at
                    """,
                    (tenant_id, proj_id, draft_id, query_id, title, url, json.dumps(extra_urls),
                     platform, published_at, status, notes)
                )
                row = cur.fetchone()
                if draft_id:
                    cur.execute(
                        "UPDATE geo_drafts SET status = 'published', updated_at = NOW() "
                        "WHERE tenant_id = %s AND id = %s",
                        (tenant_id, draft_id)
                    )
        return resp(200, {'publication': {
            'id': str(row['id']), 'title': title, 'url': url, 'urls': urls,
            'extra_urls': extra_urls,
            'platform': platform,
            'status': status, 'notes': notes,
            'draft_id': draft_id, 'query_id': query_id,
            'published_at': row['published_at'].isoformat() if row['published_at'] else None,
            'last_check_at': None, 'last_check_found': None,
            'created_at': row['created_at'].isoformat(),
            'updated_at': row['updated_at'].isoformat(),
        }})
    finally:
        conn.close()


def update_publication(tenant_id: str, pub_id: str, body: dict):
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    fields, values = [], []

    if 'urls' in body or ('url' in body and isinstance(body.get('urls'), list) is False):
        urls = normalize_urls(body)
        if urls:
            fields.append('url = %s'); values.append(urls[0])
            fields.append('extra_urls = %s::jsonb'); values.append(json.dumps(urls[1:]))
    for f in ('title', 'platform', 'status', 'notes'):
        if f in body:
            fields.append(f'{f} = %s'); values.append(body[f])
    if 'published_at' in body:
        fields.append('published_at = %s'); values.append(body['published_at'])
    if not fields:
        return resp(400, {'error': 'no_fields'})
    fields.append('updated_at = NOW()')
    values.extend([tenant_id, pub_id])
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE geo_publications_v2 SET {', '.join(fields)} WHERE tenant_id = %s AND id = %s",
                    values
                )
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def delete_publication(tenant_id: str, pub_id: str):
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM geo_publication_checks_v2 WHERE tenant_id = %s AND publication_id = %s',
                            (tenant_id, pub_id))
                cur.execute('DELETE FROM geo_publications_v2 WHERE tenant_id = %s AND id = %s',
                            (tenant_id, pub_id))
                if cur.rowcount == 0:
                    return resp(404, {'error': 'not_found'})
        return resp(200, {'ok': True})
    finally:
        conn.close()


def list_checks(tenant_id: str, pub_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, provider, found, snippet, checked_at
                FROM geo_publication_checks_v2
                WHERE tenant_id = %s AND publication_id = %s
                ORDER BY checked_at DESC
                LIMIT 30
                """,
                (tenant_id, pub_id)
            )
            rows = cur.fetchall()
        return resp(200, {'checks': [{
            'id': str(r['id']), 'provider': r['provider'], 'found': r['found'],
            'snippet': r['snippet'], 'checked_at': r['checked_at'].isoformat(),
        } for r in rows]})
    finally:
        conn.close()


def http_fetch(url: str, timeout: int = 10) -> tuple[int, str]:
    """Скачать страницу. Возвращает (status_code, html). Никогда не падает."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': USER_AGENT, 'Accept-Language': 'ru,en;q=0.9'},
            method='GET',
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read(200_000)  # первые 200 КБ
            try:
                text = data.decode('utf-8', errors='replace')
            except Exception:
                text = ''
            return r.getcode() or 200, text
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception:
        return 0, ''


def check_url_alive(urls: list[str]) -> dict:
    """Проверить, что хотя бы один URL отдаёт 200 и содержит осмысленный контент."""
    alive_urls = []
    checked = []
    for u in urls[:5]:
        code, html = http_fetch(u, timeout=8)
        ok = (200 <= code < 400) and len(html) > 500
        checked.append({'url': u, 'status': code, 'ok': ok, 'size': len(html)})
        if ok:
            alive_urls.append(u)
    return {
        'found': bool(alive_urls),
        'urls': alive_urls,
        'details': checked,
    }


def yandex_search(query: str, target_domains: list[str], timeout: int = 8) -> dict:
    """
    Проверить через Яндекс. Используется публичный HTML-поиск (без API-ключа).
    Возвращает found + найденные ссылки на наш домен.
    """
    try:
        q = urllib.parse.quote_plus(query)
        url = f'https://yandex.ru/search/?text={q}&lr=213'
        code, html = http_fetch(url, timeout=timeout)
        if code != 200 or not html:
            return {'found': False, 'error': f'HTTP {code}', 'matches': []}
        html_lc = html.lower()
        # Проверяем антиспам капчу Яндекса
        if 'showcaptcha' in html_lc or 'are you a robot' in html_lc:
            return {'found': False, 'error': 'captcha', 'matches': []}
        matches = [d for d in target_domains if d and d in html_lc]
        return {
            'found': bool(matches),
            'matches': matches,
            'snippet': f'Найдено упоминаний домена: {", ".join(matches)}' if matches else '',
        }
    except Exception as e:
        return {'found': False, 'error': str(e)[:200], 'matches': []}


def duckduckgo_search(query: str, target_domains: list[str], timeout: int = 8) -> dict:
    """
    Проверить через DuckDuckGo HTML-поиск (без API-ключа, без капчи).
    Google почти всегда требует API-ключ или возвращает капчу — DDG надёжнее как fallback.
    """
    try:
        q = urllib.parse.quote_plus(query)
        url = f'https://html.duckduckgo.com/html/?q={q}'
        code, html = http_fetch(url, timeout=timeout)
        if code != 200 or not html:
            return {'found': False, 'error': f'HTTP {code}', 'matches': []}
        html_lc = html.lower()
        matches = [d for d in target_domains if d and d in html_lc]
        return {
            'found': bool(matches),
            'matches': matches,
            'snippet': f'Найдено упоминаний домена: {", ".join(matches)}' if matches else '',
        }
    except Exception as e:
        return {'found': False, 'error': str(e)[:200], 'matches': []}


def call_search_llm(provider_key: str, query: str, timeout: int = 40) -> dict:
    """
    Вызов search-enabled LLM (модели с реальным доступом в интернет: Sonar, gpt-4o-search).
    Эти модели обращаются к веб-поиску и возвращают цитаты.
    """
    model = SEARCH_LLM_PROVIDERS.get(provider_key)
    if not model:
        raise ValueError(f'unknown search provider: {provider_key}')
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    sys_prompt = (
        'Ты — поисковый ассистент с доступом к интернету. Найди в реальном вебе '
        'актуальные источники по запросу. ВСЕГДА указывай конкретные URL источников '
        'в ответе (формат https://...). Если источников несколько — перечисли все. '
        'Если по теме нет свежих источников — честно скажи об этом.'
    )
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': query},
        ],
        'temperature': 0.2,
        'max_tokens': 1200,
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
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'SearchLLM HTTP {e.code}: {err_body[:200]}')
    choice = body['choices'][0]['message']
    return {
        'text': choice.get('content', '') or '',
        'citations': body.get('citations') or choice.get('citations') or [],
        'model': body.get('model', model),
    }


def find_urls_in_text(text: str) -> list[str]:
    """Извлечь все URL из произвольного текста."""
    import re
    return re.findall(r'https?://[^\s\)"\'>\]]+', text or '')


def check_publication(tenant_id: str, pub_id: str):
    """
    Полная проверка попадания публикации в нейровыдачу.

    Реальные проверки:
      1) url_alive — публикация жива (отдаёт 200, есть контент)
      2) yandex_search — индексирована Яндексом по теме
      3) duckduckgo — индексирована DDG/Bing
      4) perplexity_sonar — search-enabled LLM с реальным доступом в интернет
      5) gpt4o_search — search-preview модель
    """
    if not pub_id:
        return resp(400, {'error': 'id_required'})
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.url, p.extra_urls, p.title, p.query_id, q.text AS query_text
                FROM geo_publications_v2 p
                LEFT JOIN geo_tracked_queries q ON q.id = p.query_id AND q.tenant_id = p.tenant_id
                WHERE p.tenant_id = %s AND p.id = %s
                """,
                (tenant_id, pub_id)
            )
            pub = cur.fetchone()
        if not pub:
            return resp(404, {'error': 'not_found'})

        extra = pub.get('extra_urls') or []
        if isinstance(extra, str):
            try:
                extra = json.loads(extra)
            except Exception:
                extra = []
        all_urls = [pub['url']] + [u for u in extra if u]
        domains = list({d for d in (extract_domain(u) for u in all_urls) if d})
        title = (pub['title'] or '').strip()
        query_text = pub['query_text'] or title or ''

        # Запрос для поисковиков: title + название домена для усиления
        # Если есть конкретная query — комбинируем
        search_query = f'{title} {domains[0]}' if title and domains else (title or query_text)

        results = []
        any_found = False

        def _save(provider: str, found: bool, snippet: str, raw: str):
            try:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            'INSERT INTO geo_publication_checks_v2 '
                            '(tenant_id, publication_id, provider, found, snippet, raw_response) '
                            'VALUES (%s, %s, %s, %s, %s, %s)',
                            (tenant_id, pub_id, provider, found, snippet[:1024], raw[:5000])
                        )
            except Exception as save_err:
                print(f'[pub-check] save {provider}: {save_err}')

        # 1) Проверка живости URL — главное доказательство, что публикация в открытом интернете
        try:
            alive = check_url_alive(all_urls)
            snippet = (
                f'Страница отвечает кодом 200 и содержит контент'
                if alive['found']
                else 'Ни один из указанных URL не отвечает (страница удалена или закрыта от ботов)'
            )
            results.append({
                'provider': 'url_alive',
                'found': alive['found'],
                'snippet': snippet,
                'details': alive['details'],
            })
            _save('url_alive', alive['found'], snippet, json.dumps(alive['details'], ensure_ascii=False))
            if alive['found']:
                any_found = True
        except Exception as e:
            print(f'[pub-check] url_alive: {e}')
            results.append({'provider': 'url_alive', 'found': False, 'error': str(e)[:200]})

        # 2) Яндекс — публичный HTML-поиск
        if search_query and domains:
            ya = yandex_search(search_query, domains)
            snippet = ya.get('snippet') or (
                'Не найдено в результатах Яндекса. '
                'Возможно, ещё не проиндексировано (нужно 1–4 недели после публикации).'
            )
            if ya.get('error'):
                snippet = f'Яндекс: {ya["error"]} (попробуйте позже)'
            results.append({
                'provider': 'yandex_search',
                'found': ya['found'],
                'snippet': snippet,
                'matches': ya.get('matches', []),
            })
            _save('yandex_search', ya['found'], snippet, json.dumps(ya, ensure_ascii=False))
            if ya['found']:
                any_found = True

        # 3) DuckDuckGo (≈ Bing/Google)
        if search_query and domains:
            ddg = duckduckgo_search(search_query, domains)
            snippet = ddg.get('snippet') or 'Не найдено в DuckDuckGo (Bing/Google).'
            if ddg.get('error'):
                snippet = f'DuckDuckGo: {ddg["error"]} (попробуйте позже)'
            results.append({
                'provider': 'duckduckgo',
                'found': ddg['found'],
                'snippet': snippet,
                'matches': ddg.get('matches', []),
            })
            _save('duckduckgo', ddg['found'], snippet, json.dumps(ddg, ensure_ascii=False))
            if ddg['found']:
                any_found = True

        # 4) YandexGPT — отдельная нейросеть (без веб-поиска, но проверим знает ли она)
        if query_text or title:
            try:
                yag = call_yandex_gpt(query_text or title)
                text_lc = (yag.get('text') or '').lower()
                cited_urls_y = find_urls_in_text(yag.get('text') or '')
                matched_yag = ''
                for u in all_urls:
                    if u.lower().rstrip('/') in text_lc:
                        matched_yag = u
                        break
                matched_dom_y = ''
                if not matched_yag:
                    for dom in domains:
                        if dom in text_lc:
                            matched_dom_y = dom
                            break
                found_y = bool(matched_yag or matched_dom_y)
                if matched_yag:
                    snip_y = f'YandexGPT процитировал ваш URL: {matched_yag}'
                elif matched_dom_y:
                    snip_y = f'YandexGPT упомянул ваш домен {matched_dom_y}'
                else:
                    snip_y = 'YandexGPT не упомянул вашу публикацию в ответе по теме'
                results.append({
                    'provider': 'yandex_gpt',
                    'found': found_y,
                    'snippet': snip_y,
                    'citations': cited_urls_y[:5],
                })
                _save('yandex_gpt', found_y, snip_y, yag.get('text') or '')
                if found_y:
                    any_found = True
            except Exception as e:
                msg = str(e)[:200]
                print(f'[pub-check] yandex_gpt: {msg}')
                results.append({'provider': 'yandex_gpt', 'found': False, 'error': msg})
                _save('yandex_gpt', False, msg, msg)

        # 5) Search-enabled LLM (Perplexity Sonar, GPT-4o Search) — нейровыдача
        for provider in SEARCH_LLM_PROVIDERS.keys():
            try:
                r = call_search_llm(provider, query_text or search_query)
            except Exception as e:
                msg = str(e)[:200]
                print(f'[pub-check] {provider}: {msg}')
                low = msg.lower()
                user_msg = msg
                if any(w in low for w in ('insufficient', 'balance', 'payment', '402', 'недостаточно')):
                    user_msg = 'У провайдера моделей нет средств — пополните vsegpt.ru'
                elif '404' in low or 'not found' in low or 'model' in low:
                    user_msg = f'Search-модель «{provider}» недоступна у провайдера'
                results.append({'provider': provider, 'found': False, 'error': user_msg})
                _save(provider, False, user_msg, msg)
                continue

            text_lc = (r['text'] or '').lower()
            citations = r.get('citations') or []
            # Собираем URL'ы и из цитат, и из текста ответа
            cited_urls = [str(c) for c in citations] + find_urls_in_text(r['text'] or '')
            cited_lc = [u.lower() for u in cited_urls]

            matched_url = ''
            matched_domain = ''
            for u in all_urls:
                u_lc = u.lower().rstrip('/')
                for c in cited_lc:
                    if u_lc in c or c.rstrip('/') == u_lc:
                        matched_url = u
                        break
                if matched_url:
                    break
            if not matched_url:
                for dom in domains:
                    if any(dom in c for c in cited_lc) or dom in text_lc:
                        matched_domain = dom
                        break

            found = bool(matched_url or matched_domain)

            if matched_url:
                snippet = f'Нейросеть процитировала именно вашу ссылку: {matched_url}'
            elif matched_domain:
                snippet = f'Нейросеть сослалась на ваш домен {matched_domain} (не точный URL)'
            else:
                snippet = (
                    'Нейросеть нашла источники по теме, но вашей публикации среди них нет. '
                    f'Цитаты, которые она привела: {", ".join(cited_urls[:3]) or "—"}'
                )

            results.append({
                'provider': provider,
                'found': found,
                'snippet': snippet[:500],
                'citations': cited_urls[:5],
            })
            _save(provider, found, snippet, r['text'])
            if found:
                any_found = True

        # Обновляем сводный статус
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'UPDATE geo_publications_v2 SET last_check_at = NOW(), last_check_found = %s, updated_at = NOW() '
                        'WHERE tenant_id = %s AND id = %s',
                        (any_found, tenant_id, pub_id)
                    )
        except Exception as e:
            print(f'[pub-check] update pub: {e}')

        return resp(200, {
            'found': any_found,
            'results': results,
            'summary': (
                'Публикация найдена в открытом интернете' if any_found
                else 'Публикация пока не индексирована в проверенных источниках. '
                     'После публикации обычно нужно 1–4 недели, чтобы поисковики и нейросети её увидели.'
            ),
        })
    finally:
        conn.close()