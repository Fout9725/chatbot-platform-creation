import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Одноразовая настройка Yandex Cloud Timer Trigger для poll-scheduler-worker
    Args: event - HTTP request
          context - cloud function context
    Returns: Инструкции по настройке триггера
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Инструкции для настройки через Yandex CLI или веб-консоль
    instructions = {
        'status': 'manual_setup_required',
        'message': 'Для автоматической отправки опросов нужно создать Yandex Cloud Timer Trigger',
        'steps': [
            {
                'step': 1,
                'description': 'Откройте Yandex Cloud Console',
                'url': 'https://console.cloud.yandex.ru'
            },
            {
                'step': 2,
                'description': 'Перейдите в Cloud Functions → Триггеры → Создать триггер'
            },
            {
                'step': 3,
                'description': 'Выберите тип: Timer (Таймер)'
            },
            {
                'step': 4,
                'description': 'Cron-выражение',
                'value': '*/1 * * * ? *',
                'note': 'Каждую минуту'
            },
            {
                'step': 5,
                'description': 'Выберите функцию: poll-scheduler-worker',
                'function_id': os.environ.get('FUNCTION_ID', 'unknown')
            },
            {
                'step': 6,
                'description': 'Сохраните триггер'
            }
        ],
        'alternative': {
            'method': 'Yandex CLI',
            'command': f'''yc serverless trigger create timer \\
  --name poll-scheduler-timer \\
  --cron-expression '*/1 * * * ? *' \\
  --invoke-function-name poll-scheduler-worker \\
  --invoke-function-service-account-id <SERVICE_ACCOUNT_ID>''',
            'docs': 'https://cloud.yandex.ru/docs/functions/operations/trigger/timer-create'
        },
        'worker_url': 'https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442',
        'note': 'После создания триггера опросы будут отправляться автоматически каждую минуту'
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(instructions, ensure_ascii=False, indent=2)
    }
