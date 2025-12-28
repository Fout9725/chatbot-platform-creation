import json
import os
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Тестовая функция для диагностики OpenRouter API responses'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No OPENROUTER_API_KEY'}),
            'isBase64Encoded': False
        }
    
    # Тестовый запрос к google/gemini-3-pro-image-preview
    url = 'https://openrouter.ai/api/v1/chat/completions'
    
    request_body = {
        'model': 'google/gemini-3-pro-image-preview',
        'messages': [{
            'role': 'user',
            'content': [{'type': 'text', 'text': 'Generate a beautiful sunset over mountains'}]
        }],
        'max_tokens': 1000,
        'modalities': ['image']
    }
    
    data = json.dumps(request_body).encode('utf-8')
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://poehali.dev',
        'X-Title': 'Test OpenRouter'
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # Возвращаем полный ответ для анализа
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'response': result,
                    'message_keys': list(result.get('choices', [{}])[0].get('message', {}).keys()),
                    'has_images': 'images' in result.get('choices', [{}])[0].get('message', {}),
                    'content_type': str(type(result.get('choices', [{}])[0].get('message', {}).get('content')))
                }, indent=2, ensure_ascii=False),
                'isBase64Encoded': False
            }
    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'traceback': traceback.format_exc()}),
            'isBase64Encoded': False
        }
