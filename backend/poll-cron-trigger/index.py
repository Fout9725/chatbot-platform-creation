import json
import os
import urllib.request
from typing import Dict, Any

# URL'ы внешних воркеров, которые этот cron-триггер пробуждает каждый запуск.
TELEGRAM_POLL_WORKER_URL = 'https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442'
GEO_CRON_URL = 'https://functions.poehali.dev/cab0cab4-16c4-4522-95e3-b95f8fb0fb12'


def _call(url: str, payload: dict, timeout: int = 28, extra_headers: dict | None = None):
    """Дёрнуть внешний URL и вернуть dict с результатом или ошибкой (никогда не падает)."""
    headers = {'Content-Type': 'application/json'}
    if extra_headers:
        headers.update(extra_headers)
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode('utf-8') or '{}'
            try:
                return {'ok': True, 'status': response.status, 'data': json.loads(body)}
            except json.JSONDecodeError:
                return {'ok': True, 'status': response.status, 'data': body[:500]}
    except Exception as e:
        return {'ok': False, 'error': str(e)[:300]}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Cron-trigger каждые N минут. Будит:
      1) Telegram poll-scheduler-worker (старая система опросов)
      2) GEO-Factory cron (автоопрос LLM и проверка публикаций)
    Args: event - HTTP request (called by external cron service)
          context - cloud function context
    Returns: HTTP-ответ с результатами обоих воркеров (не падает целиком, если один сломан)
    '''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    # 1) Telegram-опросник (не критичен, если 402 — просто логируем)
    telegram_result = _call(TELEGRAM_POLL_WORKER_URL, {}, timeout=15)
    if not telegram_result.get('ok'):
        print(f'[cron] telegram-poll-worker: {telegram_result.get("error")}')

    # 2) GEO-Factory cron — главное: опрос и проверка публикаций по расписанию
    geo_headers = {}
    cron_key = os.environ.get('GEO_CRON_KEY', '')
    if cron_key:
        geo_headers['X-Cron-Key'] = cron_key
    geo_result = _call(GEO_CRON_URL, {'kind': 'all'}, timeout=28, extra_headers=geo_headers)
    if not geo_result.get('ok'):
        print(f'[cron] geo-cron: {geo_result.get("error")}')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'status': 'success',
            'telegram_poll': telegram_result,
            'geo_cron': geo_result,
        })
    }