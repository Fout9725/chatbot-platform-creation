import json
import hmac
import hashlib
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка webhook от Prodamus о статусе платежа
    Args: event - dict с httpMethod, body, headers
          context - object с request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        webhook_data = json.loads(body_str)
        
        order_id = webhook_data.get('order_id')
        order_num = webhook_data.get('order_num')
        payment_status = webhook_data.get('payment_status')
        customer_email = webhook_data.get('customer_email')
        customer_extra = webhook_data.get('customer_extra', {})
        products = webhook_data.get('products', [])
        order_sum = webhook_data.get('order_sum')
        
        if payment_status == 'success':
            user_id = customer_extra.get('user_id') if isinstance(customer_extra, dict) else None
            plan_id = customer_extra.get('plan_id') if isinstance(customer_extra, dict) else None
            
            print(f"Payment successful: order_id={order_id}, user={user_id}, plan={plan_id}, amount={order_sum}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'received',
                'order_id': order_id,
                'payment_status': payment_status
            }),
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
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
