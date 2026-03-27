import json
import os
import uuid
from typing import Dict, Any
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400'
}

def make_response(status_code: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, default=str)
    }

def create_payment(body_data: dict) -> Dict[str, Any]:
    """Создание платежа через ЮKassa API"""
    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    api_key = os.environ.get('YOOKASSA_API_KEY')

    if not shop_id or not api_key:
        return make_response(500, {'error': 'Payment system not configured'})

    amount = body_data.get('amount')
    description = body_data.get('description', '')
    return_url = body_data.get('return_url', '')
    email = body_data.get('email', '')
    metadata = body_data.get('metadata', {})

    if not amount or not return_url:
        return make_response(400, {'error': 'amount and return_url are required'})

    idempotence_key = str(uuid.uuid4())

    payment_data = {
        'amount': {
            'value': str(amount),
            'currency': 'RUB'
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': return_url
        },
        'capture': True,
        'description': description,
        'metadata': metadata
    }

    if email:
        payment_data['receipt'] = {
            'customer': {'email': email},
            'items': [{
                'description': description[:128] if description else 'Оплата услуги',
                'quantity': '1.00',
                'amount': {
                    'value': str(amount),
                    'currency': 'RUB'
                },
                'vat_code': 1,
                'payment_subject': 'service',
                'payment_mode': 'full_payment'
            }]
        }

    resp = requests.post(
        'https://api.yookassa.ru/v3/payments',
        json=payment_data,
        auth=(shop_id, api_key),
        headers={
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        }
    )

    if resp.status_code not in (200, 201):
        return make_response(502, {'error': 'Payment creation failed', 'details': resp.text})

    result = resp.json()
    confirmation_url = result.get('confirmation', {}).get('confirmation_url', '')
    payment_id = result.get('id', '')

    return make_response(200, {
        'success': True,
        'payment_id': payment_id,
        'confirmation_url': confirmation_url
    })

def handle_webhook(body_data: dict) -> Dict[str, Any]:
    """Обработка вебхука от ЮKassa при успешной оплате"""
    event_type = body_data.get('event', '')
    payment_obj = body_data.get('object', {})

    if event_type != 'payment.succeeded':
        return make_response(200, {'status': 'ignored'})

    metadata = payment_obj.get('metadata', {})
    user_id = metadata.get('user_id')
    payment_type = metadata.get('type')
    plan_id = metadata.get('plan_id')

    if not user_id:
        return make_response(200, {'status': 'no_user_id'})

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return make_response(500, {'error': 'Database not configured'})

    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if payment_type == 'plan' and plan_id:
        cur.execute('UPDATE users SET plan_type = %s WHERE id = %s', (plan_id, int(user_id)))
        conn.commit()

    cur.close()
    conn.close()

    return make_response(200, {'status': 'ok'})

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Создание платежей через ЮKassa и обработка вебхуков оплаты'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return make_response(405, {'error': 'Method not allowed'})

    body_data = json.loads(event.get('body', '{}'))

    action = body_data.get('action', '')

    if action == 'create':
        return create_payment(body_data)
    elif body_data.get('event'):
        return handle_webhook(body_data)
    else:
        return make_response(400, {'error': 'Unknown action'})
