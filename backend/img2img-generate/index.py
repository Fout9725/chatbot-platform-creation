"""Генерация изображений img2img через VseGPT API"""

import json
import os
import urllib.request
import base64

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

AVAILABLE_MODELS = [
    'img2img-google/nano-banana-pro-edit-multi',
    'img2img-google/nano-banana-2-edit-multi',
    'img2img-flux/flux-2-klein-4b',
    'img2img-bytedance/seedream-v4.5-edit-multi',
    'img2img-reve-fast-edit-multi',
    'img2img-nvidia/chrono-edit-thinking',
    'img2img-google/flash-25-edit-multi',
]


def handler(event, context):
    """Редактирование изображений через VseGPT img2img модели (FLUX, Seedream, Chrono и др.)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'models': AVAILABLE_MODELS,
                'status': 'ready'
            })
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    api_key = os.environ.get('VSEGPT_API_KEY', '')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'VSEGPT_API_KEY не настроен'})
        }

    body = json.loads(event.get('body', '{}'))
    model_id = body.get('model', '')
    prompt = body.get('prompt', '')
    image_base64 = body.get('image_base64', '')

    if not model_id:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Не указана модель (model)'})
        }

    if model_id not in AVAILABLE_MODELS:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Неизвестная модель: {model_id}', 'available': AVAILABLE_MODELS})
        }

    if not prompt:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Не указан промпт (prompt)'})
        }

    if not image_base64:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Не передано изображение (image_base64)'})
        }

    if not image_base64.startswith('data:'):
        image_base64 = f'data:image/jpeg;base64,{image_base64}'

    messages = [
        {
            'role': 'user',
            'content': [
                {
                    'type': 'image_url',
                    'image_url': {'url': image_base64}
                },
                {
                    'type': 'text',
                    'text': prompt
                }
            ]
        }
    ]

    payload = json.dumps({
        'model': model_id,
        'messages': messages,
        'max_tokens': 4096
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.vsegpt.ru/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode('utf-8'))

    choices = result.get('choices', [])
    if not choices:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Пустой ответ от VseGPT', 'raw': result})
        }

    message = choices[0].get('message', {})
    content = message.get('content', '')

    result_image = None

    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict):
                if part.get('type') == 'image_url':
                    img_url = part.get('image_url', {})
                    if isinstance(img_url, dict):
                        result_image = img_url.get('url', '')
                    elif isinstance(img_url, str):
                        result_image = img_url
                elif part.get('type') == 'image':
                    result_image = part.get('url', '') or part.get('image_url', {}).get('url', '')
            if result_image:
                break

    if not result_image and isinstance(content, str):
        if content.startswith('data:image') or content.startswith('http'):
            result_image = content

    if not result_image:
        images = message.get('images', [])
        if images:
            result_image = images[0] if isinstance(images[0], str) else images[0].get('url', '')

    if not result_image:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': False,
                'error': 'Не удалось извлечь изображение из ответа',
                'raw_content_type': str(type(content)),
                'raw_keys': list(message.keys()),
                'content_preview': str(content)[:500] if content else 'empty'
            })
        }

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'success': True,
            'image': result_image,
            'model': model_id,
            'usage': result.get('usage', {})
        })
    }