import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Настройка webhook для Telegram бота Опросник
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    bot_token = os.environ.get('POLL_BOT_TOKEN')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'POLL_BOT_TOKEN not configured'}),
            'isBase64Encoded': False
        }
    
    webhook_url = 'https://functions.poehali.dev/dee8fe93-01c0-4f74-92c1-a23ec5c6c5f7'
    
    if method == 'POST':
        telegram_url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
        response = requests.post(telegram_url, json={'url': webhook_url}, timeout=10)
        result = response.json()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'action': 'setWebhook',
                'webhook_url': webhook_url,
                'result': result
            }),
            'isBase64Encoded': False
        }
    
    elif method == 'GET':
        telegram_url = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
        response = requests.get(telegram_url, timeout=10)
        result = response.json()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'action': 'getWebhookInfo',
                'result': result
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
