import json
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Cron trigger that calls poll-scheduler-worker every minute
    Args: event - HTTP request (called by external cron service)
          context - cloud function context
    Returns: HTTP response with worker result
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
    
    # URL воркера
    worker_url = 'https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442'
    
    try:
        req = urllib.request.Request(
            worker_url,
            data=json.dumps({}).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'status': 'success',
                    'worker_result': result
                })
            }
    except Exception as e:
        print(f'Error calling worker: {e}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'status': 'error',
                'error': str(e)
            })
        }
