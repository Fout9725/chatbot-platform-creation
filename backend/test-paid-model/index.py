'''
Business: Тестовый запрос к платной модели OpenRouter для диагностики
Args: event - dict с httpMethod (GET), queryStringParameters с model
      context - object с request_id
Returns: HTTP response dict с результатом теста
'''

import json
import os
import requests
from typing import Dict, Any, Optional

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')

IMAGE_MODELS = {
    'gemini-3-pro': {'id': 'google/gemini-3-pro-image-preview', 'name': '🎨 Gemini 3 Pro'},
    'gpt-5-image': {'id': 'openai/gpt-5-image', 'name': '🤖 GPT-5 Image'},
    'gpt-5-mini': {'id': 'openai/gpt-5-image-mini', 'name': '⚡ GPT-5 Mini'},
    'gemini-2.5-flash': {'id': 'google/gemini-2.5-flash-image', 'name': '🌟 Gemini 2.5 Flash'}
}

def test_model(model_key: str, prompt: str) -> Dict[str, Any]:
    '''Тестирует одну модель с заданным промптом'''
    
    if model_key not in IMAGE_MODELS:
        return {'error': f'Unknown model: {model_key}'}
    
    model_info = IMAGE_MODELS[model_key]
    model_id = model_info['id']
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'NeurophotoBot-Test'
        }
        
        payload = {
            'model': model_id,
            'messages': [{'role': 'user', 'content': prompt}],
            'modalities': ['text', 'image'],
            'stream': False,
            'max_tokens': 4096
        }
        
        print(f'Testing model: {model_info["name"]} ({model_id})')
        print(f'Prompt: {prompt}')
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=25
        )
        
        print(f'Response status: {response.status_code}')
        print(f'Response headers: {dict(response.headers)}')
        print(f'Response body preview: {response.text[:1000]}')
        
        result = {
            'model': model_key,
            'model_id': model_id,
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'body_preview': response.text[:1000]
        }
        
        if response.status_code == 200:
            data = response.json()
            result['response_keys'] = list(data.keys())
            
            # Проверяем на ошибку
            if data.get('error'):
                result['error'] = data['error']
                result['success'] = False
            # Проверяем наличие изображения
            elif data.get('images') and len(data['images']) > 0:
                result['success'] = True
                result['image_type'] = 'data_url'
                result['image_preview'] = data['images'][0][:100]
            elif data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                if message.get('images'):
                    result['success'] = True
                    result['image_type'] = 'message_images'
                    result['image_preview'] = str(message['images'][0])[:100]
                elif message.get('content', '').startswith('data:image'):
                    result['success'] = True
                    result['image_type'] = 'message_content'
                    result['image_preview'] = message['content'][:100]
                else:
                    result['success'] = False
                    result['message'] = 'No image in response'
                    result['message_keys'] = list(message.keys())
                    result['content_preview'] = str(message.get('content', ''))[:200]
            else:
                result['success'] = False
                result['message'] = 'Unknown response format'
                result['full_response'] = data
        else:
            result['success'] = False
            result['error_body'] = response.text
        
        return result
        
    except requests.exceptions.Timeout:
        return {
            'model': model_key,
            'model_id': model_id,
            'success': False,
            'error': 'Timeout after 25 seconds'
        }
    except Exception as e:
        import traceback
        return {
            'model': model_key,
            'model_id': model_id,
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if not OPENROUTER_API_KEY:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OPENROUTER_API_KEY not configured'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    model_key = params.get('model', 'gemini-2.5-flash')  # Самая дешевая модель по умолчанию
    prompt = params.get('prompt', 'A simple red circle on white background')
    
    print(f'Testing model: {model_key}')
    result = test_model(model_key, prompt)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result, indent=2),
        'isBase64Encoded': False
    }
