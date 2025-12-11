import json
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Запускает poll-scheduler-worker в непрерывном режиме
    Args: event - HTTP request
          context - cloud function context
    Returns: Статус запуска
    '''
    method = event.get('httpMethod', 'GET')
    
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
    
    worker_url = 'https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442'
    req = urllib.request.Request(
        worker_url,
        data=json.dumps({'continuous': True}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    # Асинхронный запуск - не ждём ответа (воркер будет работать долго)
    try:
        urllib.request.urlopen(req, timeout=1)
    except:
        pass  # Игнорируем таймауты - воркер уже запустился
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'status': 'started',
            'message': 'Poll scheduler worker запущен в непрерывном режиме. Опросы будут отправляться автоматически каждую минуту.',
            'worker_url': worker_url
        }, ensure_ascii=False)
    }