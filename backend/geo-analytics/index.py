"""
Business: Аналитика GEO-платформы — SOV, динамика, лента упоминаний, покрытие запросов.
Args: event с httpMethod=GET, headers (X-Auth-Token), queryStringParameters (action, days, limit, query_id)
Returns: HTTP-ответ с агрегированными метриками
"""
import json
import os
import hmac
import hashlib
import base64
import time
import psycopg2
from psycopg2.extras import RealDictCursor


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'isBase64Encoded': False, 'body': ''}
    if method != 'GET':
        return resp(405, {'error': 'method_not_allowed'})

    headers = event.get('headers') or {}
    tenant_id = get_tenant(headers)
    if not tenant_id:
        return resp(401, {'error': 'unauthorized'})

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action') or 'overview'

    try:
        days = max(1, min(90, int(qs.get('days', '7'))))
    except (TypeError, ValueError):
        days = 7

    if action == 'overview':
        return overview(tenant_id, days)
    if action == 'sov_trend':
        return sov_trend(tenant_id, days)
    if action == 'mentions':
        try:
            limit = max(1, min(100, int(qs.get('limit', '20'))))
        except (TypeError, ValueError):
            limit = 20
        return mentions_feed(tenant_id, days, limit)
    if action == 'coverage':
        return coverage(tenant_id, days)
    return resp(400, {'error': 'unknown_action'})


def overview(tenant_id: str, days: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT COUNT(*) FILTER (WHERE is_active) AS active, COUNT(*) AS total '
                'FROM geo_tracked_queries WHERE tenant_id = %s', (tenant_id,)
            )
            q = cur.fetchone()

            cur.execute(
                'SELECT COUNT(*) FILTER (WHERE is_own) AS own, COUNT(*) AS total '
                'FROM geo_brands WHERE tenant_id = %s', (tenant_id,)
            )
            b = cur.fetchone()

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM geo_mentions "
                "WHERE tenant_id = %s AND created_at >= NOW() - (%s || ' days')::interval",
                (tenant_id, days)
            )
            mentions_cnt = cur.fetchone()['cnt']

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM geo_llm_responses "
                "WHERE tenant_id = %s AND polled_at >= NOW() - (%s || ' days')::interval",
                (tenant_id, days)
            )
            responses_cnt = cur.fetchone()['cnt']

            cur.execute(
                """
                SELECT b.id, b.name, b.is_own, COUNT(m.id) AS mentions,
                       AVG(m.sentiment_score)::float AS avg_sentiment
                FROM geo_brands b
                LEFT JOIN geo_mentions m
                  ON m.brand_id = b.id AND m.tenant_id = b.tenant_id
                  AND m.created_at >= NOW() - (%s || ' days')::interval
                WHERE b.tenant_id = %s
                GROUP BY b.id, b.name, b.is_own
                ORDER BY mentions DESC
                """,
                (days, tenant_id)
            )
            brands_rows = cur.fetchall()

            total_mentions = sum(r['mentions'] for r in brands_rows) or 0
            sov = []
            own_sov = 0.0
            for r in brands_rows:
                share = (r['mentions'] / total_mentions * 100) if total_mentions else 0.0
                if r['is_own']:
                    own_sov = share
                sov.append({
                    'brand_id': str(r['id']),
                    'name': r['name'],
                    'is_own': r['is_own'],
                    'mentions': r['mentions'],
                    'sov': round(share, 1),
                    'avg_sentiment': round(r['avg_sentiment'] or 0.0, 2),
                })

            cur.execute(
                """
                SELECT COUNT(DISTINCT q.id) AS covered
                FROM geo_tracked_queries q
                JOIN geo_llm_responses r ON r.query_id = q.id AND r.tenant_id = q.tenant_id
                JOIN geo_mentions m ON m.response_id = r.id AND m.tenant_id = q.tenant_id
                JOIN geo_brands b ON b.id = m.brand_id AND b.tenant_id = q.tenant_id
                WHERE q.tenant_id = %s AND b.is_own = TRUE
                  AND r.polled_at >= NOW() - (%s || ' days')::interval
                """,
                (tenant_id, days)
            )
            covered = cur.fetchone()['covered'] or 0

        return resp(200, {
            'period_days': days,
            'queries': {'active': q['active'] or 0, 'total': q['total'] or 0},
            'brands': {'own': b['own'] or 0, 'total': b['total'] or 0},
            'responses': responses_cnt,
            'mentions': mentions_cnt,
            'own_sov': round(own_sov, 1),
            'covered_queries': covered,
            'sov': sov,
        })
    finally:
        conn.close()


def sov_trend(tenant_id: str, days: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                WITH days_series AS (
                  SELECT generate_series(
                    (CURRENT_DATE - (%s - 1) * INTERVAL '1 day')::date,
                    CURRENT_DATE,
                    INTERVAL '1 day'
                  )::date AS day
                ),
                daily AS (
                  SELECT date_trunc('day', m.created_at)::date AS day,
                         b.id AS brand_id, b.name, b.is_own,
                         COUNT(*) AS cnt
                  FROM geo_mentions m
                  JOIN geo_brands b ON b.id = m.brand_id AND b.tenant_id = m.tenant_id
                  WHERE m.tenant_id = %s
                    AND m.created_at >= CURRENT_DATE - (%s - 1) * INTERVAL '1 day'
                  GROUP BY 1, 2, 3, 4
                )
                SELECT ds.day, d.brand_id, d.name, d.is_own, COALESCE(d.cnt, 0) AS cnt
                FROM days_series ds
                LEFT JOIN daily d ON d.day = ds.day
                ORDER BY ds.day, d.brand_id NULLS LAST
                """,
                (days, tenant_id, days)
            )
            rows = cur.fetchall()

        days_map = {}
        brands_set = {}
        for r in rows:
            day = r['day'].isoformat()
            if day not in days_map:
                days_map[day] = {}
            if r['brand_id']:
                bid = str(r['brand_id'])
                days_map[day][bid] = r['cnt']
                brands_set[bid] = {'id': bid, 'name': r['name'], 'is_own': r['is_own']}

        brands_list = list(brands_set.values())
        trend = []
        for day in sorted(days_map.keys()):
            total = sum(days_map[day].values()) or 0
            point = {'day': day, 'total': total}
            for b in brands_list:
                cnt = days_map[day].get(b['id'], 0)
                point[b['name']] = round((cnt / total * 100) if total else 0, 1)
            trend.append(point)

        return resp(200, {'trend': trend, 'brands': brands_list})
    finally:
        conn.close()


def mentions_feed(tenant_id: str, days: int, limit: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT m.id, m.sentiment, m.sentiment_score, m.snippet, m.position, m.created_at,
                       b.name AS brand_name, b.is_own,
                       r.provider, r.model,
                       q.text AS query_text, q.id AS query_id
                FROM geo_mentions m
                JOIN geo_brands b ON b.id = m.brand_id AND b.tenant_id = m.tenant_id
                JOIN geo_llm_responses r ON r.id = m.response_id AND r.tenant_id = m.tenant_id
                JOIN geo_tracked_queries q ON q.id = r.query_id AND q.tenant_id = m.tenant_id
                WHERE m.tenant_id = %s
                  AND m.created_at >= NOW() - (%s || ' days')::interval
                ORDER BY m.created_at DESC
                LIMIT %s
                """,
                (tenant_id, days, limit)
            )
            rows = cur.fetchall()
        return resp(200, {'mentions': [{
            'id': str(r['id']),
            'brand_name': r['brand_name'],
            'is_own': r['is_own'],
            'sentiment': r['sentiment'],
            'sentiment_score': r['sentiment_score'],
            'snippet': r['snippet'],
            'position': r['position'],
            'provider': r['provider'],
            'model': r['model'],
            'query_text': r['query_text'],
            'query_id': str(r['query_id']),
            'created_at': r['created_at'].isoformat(),
        } for r in rows]})
    finally:
        conn.close()


def coverage(tenant_id: str, days: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT q.id, q.text, q.language,
                       COUNT(DISTINCT r.id) AS responses,
                       COUNT(DISTINCT m.id) FILTER (WHERE b.is_own) AS own_mentions,
                       COUNT(DISTINCT m.id) FILTER (WHERE NOT b.is_own) AS competitor_mentions,
                       MAX(r.polled_at) AS last_polled
                FROM geo_tracked_queries q
                LEFT JOIN geo_llm_responses r
                  ON r.query_id = q.id AND r.tenant_id = q.tenant_id
                  AND r.polled_at >= NOW() - (%s || ' days')::interval
                LEFT JOIN geo_mentions m
                  ON m.response_id = r.id AND m.tenant_id = q.tenant_id
                LEFT JOIN geo_brands b
                  ON b.id = m.brand_id AND b.tenant_id = q.tenant_id
                WHERE q.tenant_id = %s
                GROUP BY q.id, q.text, q.language
                ORDER BY own_mentions DESC, responses DESC
                """,
                (days, tenant_id)
            )
            rows = cur.fetchall()
        return resp(200, {'coverage': [{
            'query_id': str(r['id']),
            'text': r['text'],
            'language': r['language'],
            'responses': r['responses'],
            'own_mentions': r['own_mentions'],
            'competitor_mentions': r['competitor_mentions'],
            'last_polled': r['last_polled'].isoformat() if r['last_polled'] else None,
        } for r in rows]})
    finally:
        conn.close()
