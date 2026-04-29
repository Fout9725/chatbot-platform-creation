"""
Business: CRON-обработчик расписания GEO-платформы. Опрашивает все активные tenant
по расписанию (poll_interval_hours), запускает проверку публикаций (pub_check_interval_hours).
Args: event с httpMethod=POST, headers (X-Cron-Key), body: {kind: 'poll'|'pub_check'|'all'}
Returns: {tenants_processed, polls_run, pub_checks_run, runs}
"""
import json
import os
import re
import hmac
import hashlib
import urllib.parse
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor


VSEGPT_BASE = 'https://api.vsegpt.ru/v1/chat/completions'
PROVIDERS = {
    'openai_gpt4o': 'openai/gpt-4o-mini',
}
MAX_QUERIES_PER_RUN = 3
POSITIVE = {'лучший', 'рекоменд', 'надёжн', 'качествен', 'удобн', 'выгодн',
            'best', 'recommended', 'great', 'excellent', 'top'}
NEGATIVE = {'плохой', 'не рекоменд', 'слабый', 'проблем', 'дорог', 'устарел',
            'bad', 'poor', 'issue', 'avoid', 'worst'}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Cron-Key',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def resp(status, body):
    return {'statusCode': status, 'headers': cors_headers(), 'isBase64Encoded': False,
            'body': json.dumps(body, ensure_ascii=False, default=str)}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def call_vsegpt(provider, query, language='ru', timeout=60):
    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        raise RuntimeError('VSEGPT_API_KEY missing')
    sys_prompt = (
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
        'max_tokens': 700,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        VSEGPT_BASE, data=data, method='POST',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        body = json.loads(r.read().decode('utf-8'))
    choice = body['choices'][0]['message']
    return {
        'text': choice.get('content', '') or '',
        'citations': body.get('citations') or choice.get('citations') or [],
        'model': body.get('model', PROVIDERS[provider]),
        'usage': body.get('usage', {}),
    }


def find_mentions(text, brands):
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
            sentiment = 'positive' if score > 0.2 else 'negative' if score < -0.2 else 'neutral'
            found.append({
                'brand_id': b['id'],
                'sentiment': sentiment,
                'score': float(score),
                'position': m.start(),
                'snippet': snippet[:1024],
            })
            break
    return found


def extract_domain(url):
    try:
        host = urllib.parse.urlparse(url).hostname or ''
        return host.replace('www.', '').lower()
    except Exception:
        return ''


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}
    if method != 'POST':
        return resp(405, {'error': 'method_not_allowed'})

    headers = event.get('headers') or {}
    cron_key = os.environ.get('GEO_CRON_KEY', '')
    if cron_key:
        provided = headers.get('X-Cron-Key') or headers.get('x-cron-key') or ''
        if not hmac.compare_digest(provided, cron_key):
            return resp(401, {'error': 'unauthorized'})

    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except json.JSONDecodeError:
        body = {}
    kind = body.get('kind') or 'all'

    summary = {'tenants_processed': 0, 'polls_run': 0, 'pub_checks_run': 0, 'runs': []}

    if kind in ('poll', 'all'):
        run_polls(summary)
    if kind in ('pub_check', 'all'):
        run_pub_checks(summary)

    return resp(200, summary)


def run_polls(summary):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, poll_interval_hours
                FROM geo_tenants
                WHERE poll_enabled = TRUE
                  AND (last_auto_poll_at IS NULL
                       OR last_auto_poll_at < NOW() - (poll_interval_hours || ' hours')::interval)
                """
            )
            tenants = cur.fetchall()

        for t in tenants:
            tenant_id = str(t['id'])
            run_id = log_start(conn, tenant_id, 'poll')
            try:
                stats = poll_tenant(conn, tenant_id)
                log_finish(conn, run_id, 'ok', stats)
                summary['polls_run'] += 1
                summary['tenants_processed'] += 1
                summary['runs'].append({'tenant_id': tenant_id, 'kind': 'poll', **stats})
                with conn:
                    with conn.cursor() as cur2:
                        cur2.execute(
                            'UPDATE geo_tenants SET last_auto_poll_at = NOW() WHERE id = %s',
                            (tenant_id,)
                        )
            except Exception as e:
                print(f'[cron-poll] tenant {tenant_id}: {e}')
                log_finish(conn, run_id, 'error', {}, error=str(e)[:500])
    finally:
        conn.close()


def poll_tenant(conn, tenant_id):
    polled, total_resp, total_ment = 0, 0, 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT q.id, q.text, q.language,
                   (SELECT MAX(polled_at) FROM geo_llm_responses r
                    WHERE r.query_id = q.id AND r.tenant_id = q.tenant_id) AS last_polled
            FROM geo_tracked_queries q
            WHERE q.tenant_id = %s AND q.is_active = TRUE
            ORDER BY last_polled NULLS FIRST, q.created_at ASC
            """,
            (tenant_id,)
        )
        queries = cur.fetchall()
        cur.execute(
            'SELECT id, name, aliases FROM geo_brands WHERE tenant_id = %s',
            (tenant_id,)
        )
        brands = [{'id': str(r['id']), 'name': r['name'], 'aliases': r['aliases'] or []}
                  for r in cur.fetchall()]

    for q in queries[:MAX_QUERIES_PER_RUN]:
        qid = str(q['id'])
        for provider in PROVIDERS:
            try:
                r = call_vsegpt(provider, q['text'], q['language'])
            except Exception as e:
                print(f'[cron-poll] {provider} {qid}: {e}')
                continue
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        'INSERT INTO geo_llm_responses '
                        '(tenant_id, query_id, provider, model, raw_text, citations, meta) '
                        'VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb) RETURNING id',
                        (tenant_id, qid, provider, r['model'], r['text'],
                         json.dumps(r['citations']), json.dumps({'usage': r['usage']}))
                    )
                    rid = str(cur.fetchone()['id'])
                    total_resp += 1
                    for m in find_mentions(r['text'], brands):
                        cur.execute(
                            'INSERT INTO geo_mentions '
                            '(tenant_id, response_id, brand_id, sentiment, sentiment_score, position, snippet) '
                            'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                            (tenant_id, rid, m['brand_id'], m['sentiment'],
                             m['score'], m['position'], m['snippet'])
                        )
                        total_ment += 1
        polled += 1
    return {'polled': polled, 'responses': total_resp, 'mentions': total_ment}


def run_pub_checks(summary):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, pub_check_interval_hours
                FROM geo_tenants
                WHERE pub_check_enabled = TRUE
                  AND (last_auto_pub_check_at IS NULL
                       OR last_auto_pub_check_at < NOW() - (pub_check_interval_hours || ' hours')::interval)
                """
            )
            tenants = cur.fetchall()

        for t in tenants:
            tenant_id = str(t['id'])
            run_id = log_start(conn, tenant_id, 'pub_check')
            try:
                stats = check_tenant_pubs(conn, tenant_id)
                log_finish(conn, run_id, 'ok', stats)
                summary['pub_checks_run'] += 1
                if tenant_id not in [r.get('tenant_id') for r in summary['runs'] if r.get('kind') == 'poll']:
                    summary['tenants_processed'] += 1
                summary['runs'].append({'tenant_id': tenant_id, 'kind': 'pub_check', **stats})
                with conn:
                    with conn.cursor() as cur2:
                        cur2.execute(
                            'UPDATE geo_tenants SET last_auto_pub_check_at = NOW() WHERE id = %s',
                            (tenant_id,)
                        )
            except Exception as e:
                print(f'[cron-pub] tenant {tenant_id}: {e}')
                log_finish(conn, run_id, 'error', {}, error=str(e)[:500])
    finally:
        conn.close()


def check_tenant_pubs(conn, tenant_id):
    checked, found = 0, 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT p.id, p.url, p.title, q.text AS query_text
            FROM geo_publications_v2 p
            LEFT JOIN geo_tracked_queries q ON q.id = p.query_id AND q.tenant_id = p.tenant_id
            WHERE p.tenant_id = %s AND p.status = 'live'
            """,
            (tenant_id,)
        )
        pubs = cur.fetchall()

    for pub in pubs:
        query_text = pub['query_text'] or pub['title']
        if not query_text:
            continue
        domain = extract_domain(pub['url'])
        url_lc = pub['url'].lower()
        title_lc = (pub['title'] or '').lower()
        any_found = False
        for provider in PROVIDERS:
            try:
                r = call_vsegpt(provider, query_text)
            except Exception as e:
                print(f'[cron-pub] {provider}: {e}')
                continue
            text_lc = (r['text'] or '').lower()
            citations = r.get('citations') or []
            in_cit = any(domain and domain in str(c).lower() for c in citations)
            in_text = (domain and domain in text_lc) or url_lc in text_lc
            by_title = title_lc and title_lc in text_lc and len(title_lc) > 15
            f = bool(in_cit or in_text or by_title)
            snippet = ''
            if domain and domain in text_lc:
                idx = text_lc.find(domain)
                snippet = r['text'][max(0, idx - 100):idx + 200]
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'INSERT INTO geo_publication_checks_v2 '
                        '(tenant_id, publication_id, provider, found, snippet, raw_response) '
                        'VALUES (%s, %s, %s, %s, %s, %s)',
                        (tenant_id, str(pub['id']), provider, f, snippet[:1024], r['text'][:5000])
                    )
            if f:
                any_found = True
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE geo_publications_v2 SET last_check_at = NOW(), last_check_found = %s, '
                    'updated_at = NOW() WHERE tenant_id = %s AND id = %s',
                    (any_found, tenant_id, str(pub['id']))
                )
        checked += 1
        if any_found:
            found += 1
    return {'checked': checked, 'found': found}


def log_start(conn, tenant_id, kind):
    with conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'INSERT INTO geo_schedule_runs (tenant_id, kind, status) '
                'VALUES (%s, %s, %s) RETURNING id',
                (tenant_id, kind, 'running')
            )
            return str(cur.fetchone()['id'])


def log_finish(conn, run_id, status, stats, error=None):
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE geo_schedule_runs
                SET status = %s,
                    polled = %s, responses = %s, mentions = %s,
                    checked = %s, found = %s,
                    error = %s, finished_at = NOW()
                WHERE id = %s
                """,
                (
                    status,
                    stats.get('polled', 0), stats.get('responses', 0), stats.get('mentions', 0),
                    stats.get('checked', 0), stats.get('found', 0),
                    error, run_id,
                )
            )