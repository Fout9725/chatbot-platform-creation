'''
Business: Тестирование платных моделей генерации изображений через OpenRouter API
Args: event - dict with httpMethod, queryStringParameters (model, prompt)
      context - object with request_id
Returns: HTTP response с результатом теста модели
'''

import json
import os
import requests
from typing import Dict, Any, Optional

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')

TEST_MODELS = {
    'gpt-5-image': 'openai/gpt-5-image',
    'nano-banana': 'google/gemini-2.5-flash-image-preview',
    'nano-banana-pro': 'google/gemini-3-pro-image-preview'
}

def test_image_generation(model_id: str, prompt: str) -> Dict[str, Any]:
    '''Тестирует генерацию изображения через OpenRouter'''
    
    if not OPENROUTER_API_KEY:
        return {
            'success': False,
            'error': 'OPENROUTER_API_KEY not configured'
        }
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'ImageModelTest'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'modalities': ['text', 'image']
        }
        
        print(f'Testing model: {model_id}')
        print(f'Prompt: {prompt}')
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f'Response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            
            # Проверяем наличие изображения
            has_image = False
            image_location = None
            
            if data.get('images'):
                has_image = True
                image_location = 'root.images'
            elif data.get('choices') and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                if message.get('images'):
                    has_image = True
                    image_location = 'choices[0].message.images'
                elif isinstance(message.get('content'), list):
                    for item in message['content']:
                        if isinstance(item, dict) and item.get('type') == 'image_url':
                            has_image = True
                            image_location = 'choices[0].message.content[].image_url'
                            break
            
            return {
                'success': True,
                'model': model_id,
                'has_image': has_image,
                'image_location': image_location,
                'response_keys': list(data.keys()),
                'full_response': json.dumps(data, indent=2, default=str)[:2000]
            }
        else:
            error_data = response.text
            return {
                'success': False,
                'model': model_id,
                'status_code': response.status_code,
                'error': error_data[:1000]
            }
            
    except Exception as e:
        return {
            'success': False,
            'model': model_id,
            'error': str(e)
        }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Тестирует модели генерации изображений
    Args: event с query params: model (название модели), prompt (текст)
    Returns: JSON с результатами теста
    '''
    
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
            'body': ''
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        model_name = params.get('model', 'all')
        prompt = params.get('prompt', 'A beautiful sunset over mountains, digital art')
        
        results = []
        
        if model_name == 'all':
            # Тестируем все модели
            for name, model_id in TEST_MODELS.items():
                result = test_image_generation(model_id, prompt)
                result['model_name'] = name
                results.append(result)
        else:
            # Тестируем одну модель
            model_id = TEST_MODELS.get(model_name)
            if not model_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Unknown model: {model_name}',
                        'available_models': list(TEST_MODELS.keys())
                    })
                }
            
            result = test_image_generation(model_id, prompt)
            result['model_name'] = model_name
            results.append(result)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'test_results': results,
                'prompt_used': prompt,
                'timestamp': context.request_id
            }, indent=2)
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }