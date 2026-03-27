import json
import os
import uuid
import hmac
import hashlib
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

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return None, None
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    return conn, cur

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
    amount_str = f"{float(amount):.2f}"

    payment_data = {
        'amount': {
            'value': amount_str,
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
                    'value': amount_str,
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
        print(f"YooKassa error: status={resp.status_code}, body={resp.text}")
        return make_response(502, {'error': 'Payment creation failed', 'details': resp.text})

    result = resp.json()
    confirmation_url = result.get('confirmation', {}).get('confirmation_url', '')
    payment_id = result.get('id', '')

    conn, cur = get_db_connection()
    if conn and cur:
        cur.execute(
            "INSERT INTO payments (yookassa_payment_id, user_id, amount, status, payment_type, description, metadata) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                payment_id,
                int(metadata.get('user_id', 0)) if metadata.get('user_id') else None,
                float(amount),
                'pending',
                metadata.get('type', 'unknown'),
                description,
                json.dumps(metadata)
            )
        )
        conn.commit()
        cur.close()
        conn.close()

    return make_response(200, {
        'success': True,
        'payment_id': payment_id,
        'confirmation_url': confirmation_url
    })

def handle_webhook(body_data: dict) -> Dict[str, Any]:
    """Обработка вебхука от ЮKassa при успешной оплате"""
    event_type = body_data.get('event', '')
    payment_obj = body_data.get('object', {})
    payment_id = payment_obj.get('id', '')
    status = payment_obj.get('status', '')

    metadata = payment_obj.get('metadata', {})
    user_id = metadata.get('user_id')
    payment_type = metadata.get('type')
    plan_id = metadata.get('plan_id')
    bot_id = metadata.get('bot_id')
    bot_name = metadata.get('bot_name')
    purchase_mode = metadata.get('purchase_mode')

    amount_obj = payment_obj.get('amount', {})
    amount = float(amount_obj.get('value', 0))

    conn, cur = get_db_connection()
    if not conn or not cur:
        return make_response(500, {'error': 'Database not configured'})

    if payment_id:
        cur.execute(
            "UPDATE payments SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE yookassa_payment_id = %s",
            (status, payment_id)
        )
        if cur.rowcount == 0 and user_id:
            cur.execute(
                "INSERT INTO payments (yookassa_payment_id, user_id, amount, status, payment_type, description, metadata) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (yookassa_payment_id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP",
                (
                    payment_id,
                    int(user_id) if user_id else None,
                    amount,
                    status,
                    payment_type or 'unknown',
                    payment_obj.get('description', ''),
                    json.dumps(metadata)
                )
            )
        conn.commit()

    if event_type != 'payment.succeeded':
        cur.close()
        conn.close()
        return make_response(200, {'status': 'logged', 'event': event_type})

    if not user_id:
        cur.close()
        conn.close()
        return make_response(200, {'status': 'no_user_id'})

    if payment_type == 'plan' and plan_id:
        cur.execute('UPDATE users SET plan_type = %s WHERE id = %s', (plan_id, int(user_id)))
        conn.commit()

    if payment_type == 'bot' and bot_id:
        cur.execute(
            "INSERT INTO payments (yookassa_payment_id, user_id, amount, status, payment_type, description, metadata) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (yookassa_payment_id) DO NOTHING",
            (
                payment_id + '_bot',
                int(user_id),
                amount,
                'succeeded',
                'bot_' + (purchase_mode or 'buy'),
                bot_name or f'Bot #{bot_id}',
                json.dumps(metadata)
            )
        )
        conn.commit()

    cur.close()
    conn.close()

    return make_response(200, {'status': 'ok', 'payment_type': payment_type})

def get_payments(event: dict) -> Dict[str, Any]:
    """Получение истории платежей пользователя"""
    params = event.get('queryStringParameters', {}) or {}
    user_id = params.get('user_id')

    if not user_id:
        return make_response(400, {'error': 'user_id is required'})

    conn, cur = get_db_connection()
    if not conn or not cur:
        return make_response(500, {'error': 'Database not configured'})

    cur.execute(
        "SELECT id, yookassa_payment_id, amount, currency, status, payment_type, description, metadata, created_at "
        "FROM payments WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (int(user_id),)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    payments = []
    for row in rows:
        payments.append({
            'id': row['id'],
            'payment_id': row['yookassa_payment_id'],
            'amount': float(row['amount']),
            'currency': row['currency'],
            'status': row['status'],
            'type': row['payment_type'],
            'description': row['description'],
            'metadata': row['metadata'] if isinstance(row['metadata'], dict) else json.loads(row['metadata'] or '{}'),
            'created_at': row['created_at'].isoformat() if row['created_at'] else None
        })

    return make_response(200, {'payments': payments, 'total': len(payments)})

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Создание платежей через ЮKassa, обработка вебхуков и история оплат'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method == 'GET':
        return get_payments(event)

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