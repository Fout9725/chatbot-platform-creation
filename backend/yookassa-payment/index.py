import json
import os
import uuid
import base64
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Создание и обработка платежей через ЮKassa API
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict с платёжной информацией
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')
    
    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Payment system not configured',
                'message': 'Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в секреты проекта'
            }),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'create')
            
            if action == 'create':
                return create_payment(body_data, shop_id, secret_key, context)
            elif action == 'check':
                return check_payment(body_data, shop_id, secret_key)
            elif action == 'webhook':
                return handle_webhook(body_data)
            else:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
                
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid JSON'}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }


def create_payment(data: Dict[str, Any], shop_id: str, secret_key: str, context: Any) -> Dict[str, Any]:
    '''Создание платежа в ЮKassa'''
    import urllib.request
    
    amount = data.get('amount', 0)
    currency = data.get('currency', 'RUB')
    description = data.get('description', 'Оплата тарифа')
    return_url = data.get('return_url', 'https://intellectpro.ru/dashboard')
    user_email = data.get('email', '')
    user_id = data.get('user_id', '')
    plan_id = data.get('plan_id', '')
    
    if amount <= 0:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid amount'}),
            'isBase64Encoded': False
        }
    
    idempotence_key = str(uuid.uuid4())
    
    payment_payload = {
        'amount': {
            'value': f'{amount:.2f}',
            'currency': currency
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': return_url
        },
        'capture': True,
        'description': description,
        'metadata': {
            'user_id': user_id,
            'plan_id': plan_id,
            'request_id': context.request_id
        }
    }
    
    if user_email:
        payment_payload['receipt'] = {
            'customer': {
                'email': user_email
            },
            'items': [
                {
                    'description': description,
                    'quantity': '1.00',
                    'amount': {
                        'value': f'{amount:.2f}',
                        'currency': currency
                    },
                    'vat_code': 1
                }
            ]
        }
    
    auth_string = f'{shop_id}:{secret_key}'
    auth_bytes = auth_string.encode('utf-8')
    auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
    
    headers = {
        'Authorization': f'Basic {auth_base64}',
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotence_key
    }
    
    try:
        req = urllib.request.Request(
            'https://api.yookassa.ru/v3/payments',
            data=json.dumps(payment_payload).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'payment_id': response_data.get('id'),
                    'status': response_data.get('status'),
                    'confirmation_url': response_data.get('confirmation', {}).get('confirmation_url'),
                    'amount': response_data.get('amount'),
                    'created_at': response_data.get('created_at')
                }),
                'isBase64Encoded': False
            }
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Payment creation failed',
                'details': error_body
            }),
            'isBase64Encoded': False
        }


def check_payment(data: Dict[str, Any], shop_id: str, secret_key: str) -> Dict[str, Any]:
    '''Проверка статуса платежа'''
    import urllib.request
    
    payment_id = data.get('payment_id', '')
    
    if not payment_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'payment_id required'}),
            'isBase64Encoded': False
        }
    
    auth_string = f'{shop_id}:{secret_key}'
    auth_bytes = auth_string.encode('utf-8')
    auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
    
    headers = {
        'Authorization': f'Basic {auth_base64}',
        'Content-Type': 'application/json'
    }
    
    try:
        req = urllib.request.Request(
            f'https://api.yookassa.ru/v3/payments/{payment_id}',
            headers=headers,
            method='GET'
        )
        
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'payment_id': response_data.get('id'),
                    'status': response_data.get('status'),
                    'paid': response_data.get('paid', False),
                    'amount': response_data.get('amount'),
                    'metadata': response_data.get('metadata'),
                    'created_at': response_data.get('created_at')
                }),
                'isBase64Encoded': False
            }
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Payment check failed',
                'details': error_body
            }),
            'isBase64Encoded': False
        }


def handle_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
    '''Обработка webhook от ЮKassa о статусе платежа'''
    event_type = data.get('event')
    payment_object = data.get('object', {})
    
    payment_id = payment_object.get('id')
    status = payment_object.get('status')
    paid = payment_object.get('paid', False)
    metadata = payment_object.get('metadata', {})
    
    if event_type == 'payment.succeeded' and paid:
        user_id = metadata.get('user_id')
        plan_id = metadata.get('plan_id')
        
        print(f'Payment succeeded: {payment_id}, user: {user_id}, plan: {plan_id}')
    
    elif event_type == 'payment.canceled':
        print(f'Payment canceled: {payment_id}')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'received': True}),
        'isBase64Encoded': False
    }
