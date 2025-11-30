'''
Business: Проверка доступных моделей OpenRouter и валидности API ключа
Args: event - dict с httpMethod (GET)
      context - object с request_id
Returns: HTTP response dict со списком доступных image моделей
'''

import json
import os
import requests
from typing import Dict, Any

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')

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
    
    try:
        # Получаем список всех моделей
        response = requests.get(
            'https://openrouter.ai/api/v1/models',
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        
        print(f'Models API response: {response.status_code}')
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'API error: {response.text}'}),
                'isBase64Encoded': False
            }
        
        data = response.json()
        models = data.get('data', [])
        
        # Фильтруем только image-генерирующие модели
        image_models = []
        for model in models:
            model_id = model.get('id', '')
            model_name = model.get('name', '')
            
            # Ищем модели с "image" в названии или поддержкой multimodal
            if 'image' in model_id.lower() or 'image' in model_name.lower():
                pricing = model.get('pricing', {})
                context_length = model.get('context_length', 0)
                
                image_models.append({
                    'id': model_id,
                    'name': model_name,
                    'pricing': {
                        'prompt': pricing.get('prompt', 'N/A'),
                        'completion': pricing.get('completion', 'N/A')
                    },
                    'context_length': context_length
                })
        
        # Также проверяем кредиты
        credits_response = requests.get(
            'https://openrouter.ai/api/v1/auth/key',
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        
        credits_data = {}
        if credits_response.status_code == 200:
            credits_data = credits_response.json().get('data', {})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'total_models': len(models),
                'image_models_count': len(image_models),
                'image_models': image_models,
                'credits': credits_data
            }, indent=2),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
