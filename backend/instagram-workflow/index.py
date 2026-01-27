import json
import os

def handler(event: dict, context) -> dict:
    '''Генерирует готовый n8n workflow для автоматизации Instagram-постов с интеграцией Claude, DALL-E и Cloudinary'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        google_sheet_id = body.get('googleSheetId', '')
        anthropic_key = body.get('anthropicApiKey', '')
        openai_key = body.get('openaiApiKey', '')
        cloudinary_cloud = body.get('cloudinaryCloudName', '')
        cloudinary_key = body.get('cloudinaryApiKey', '')
        cloudinary_secret = body.get('cloudinaryApiSecret', '')
        schedule_time = body.get('scheduleTime', '10:00')
        
        if not all([google_sheet_id, anthropic_key, openai_key]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Обязательные поля: googleSheetId, anthropicApiKey, openaiApiKey'})
            }
        
        workflow = generate_n8n_workflow(
            google_sheet_id,
            anthropic_key,
            openai_key,
            cloudinary_cloud,
            cloudinary_key,
            cloudinary_secret,
            schedule_time
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'workflow': workflow})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def generate_n8n_workflow(sheet_id: str, anthropic_key: str, openai_key: str, 
                          cloudinary_cloud: str, cloudinary_key: str, 
                          cloudinary_secret: str, schedule_time: str) -> dict:
    '''Создаёт полноценный n8n workflow JSON'''
    
    hour, minute = schedule_time.split(':')
    
    workflow = {
        "name": "Instagram Post Automation",
        "nodes": [
            {
                "parameters": {
                    "rule": {
                        "interval": [
                            {
                                "field": "cronExpression",
                                "expression": f"{minute} {hour} * * *"
                            }
                        ]
                    }
                },
                "name": "Schedule Trigger",
                "type": "n8n-nodes-base.scheduleTrigger",
                "typeVersion": 1,
                "position": [250, 300]
            },
            {
                "parameters": {
                    "operation": "read",
                    "sheetId": sheet_id,
                    "range": "A:E",
                    "options": {}
                },
                "name": "Google Sheets - Read Ideas",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 3,
                "position": [450, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": "YOUR_GOOGLE_CREDENTIALS_ID",
                        "name": "Google Sheets account"
                    }
                }
            },
            {
                "parameters": {
                    "model": "claude-3-5-sonnet-20241022",
                    "text": """=Создай пост для Instagram по идее: {{ $json.A }}

Требования:
1. Заголовок: 5-10 слов, БЕЗ эмодзи, жирным шрифтом
2. Текст: 1600-1700 символов с пробелами
3. Стиль: эмоциональный, личный опыт, история
4. Структура:
   - Заголовок жирным
   - 2-3 абзаца основного текста
   - Призыв к действию (вопрос)
   - 5-7 хэштегов в конце

Формат ответа JSON:
{
  "title": "Заголовок без эмодзи",
  "text": "Полный текст поста 1600-1700 символов"
}""",
                    "options": {
                        "temperature": 0.7,
                        "maxTokens": 2000
                    }
                },
                "name": "Claude - Generate Post Text",
                "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
                "typeVersion": 1,
                "position": [650, 300],
                "credentials": {
                    "anthropicApi": {
                        "id": "YOUR_ANTHROPIC_CREDENTIALS_ID",
                        "name": "Anthropic account"
                    }
                }
            },
            {
                "parameters": {
                    "operation": "create",
                    "prompt": f"=Create a vertical Instagram story image (1080x1920) for post about: {{{{ $json.A }}}}. Style: modern, vibrant, eye-catching. No text on image.",
                    "model": "dall-e-3",
                    "size": "1024x1792",
                    "quality": "hd"
                },
                "name": "DALL-E 3 - Generate Image",
                "type": "n8n-nodes-base.openAi",
                "typeVersion": 1,
                "position": [850, 300],
                "credentials": {
                    "openAiApi": {
                        "id": "YOUR_OPENAI_CREDENTIALS_ID",
                        "name": "OpenAI account"
                    }
                }
            },
            {
                "parameters": {
                    "operation": "upload",
                    "cloudName": cloudinary_cloud,
                    "binaryData": True,
                    "options": {
                        "transformation": [
                            {
                                "overlay": {
                                    "text": "={{ $json.title }}",
                                    "fontFamily": "Arial",
                                    "fontSize": 60,
                                    "fontWeight": "bold",
                                    "color": "#FFFFFF"
                                },
                                "gravity": "south",
                                "y": 100,
                                "effect": "shadow:50"
                            }
                        ]
                    }
                },
                "name": "Cloudinary - Add Title to Image",
                "type": "n8n-nodes-base.cloudinary",
                "typeVersion": 1,
                "position": [1050, 300],
                "credentials": {
                    "cloudinaryApi": {
                        "id": "YOUR_CLOUDINARY_CREDENTIALS_ID",
                        "name": "Cloudinary account"
                    }
                }
            },
            {
                "parameters": {
                    "operation": "update",
                    "sheetId": sheet_id,
                    "range": "=B{{ $json.rowNumber }}:E{{ $json.rowNumber }}",
                    "options": {},
                    "dataMode": "defineBelow",
                    "fieldsUi": {
                        "values": [
                            {
                                "column": "B",
                                "fieldValue": "={{ $json.text }}"
                            },
                            {
                                "column": "C",
                                "fieldValue": "={{ $json.imageUrl }}"
                            },
                            {
                                "column": "D",
                                "fieldValue": "={{ $json.title }}"
                            },
                            {
                                "column": "E",
                                "fieldValue": "Готово к модерации"
                            }
                        ]
                    }
                },
                "name": "Google Sheets - Write Results",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 3,
                "position": [1250, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": "YOUR_GOOGLE_CREDENTIALS_ID",
                        "name": "Google Sheets account"
                    }
                }
            }
        ],
        "connections": {
            "Schedule Trigger": {
                "main": [
                    [
                        {
                            "node": "Google Sheets - Read Ideas",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Google Sheets - Read Ideas": {
                "main": [
                    [
                        {
                            "node": "Claude - Generate Post Text",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Claude - Generate Post Text": {
                "main": [
                    [
                        {
                            "node": "DALL-E 3 - Generate Image",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "DALL-E 3 - Generate Image": {
                "main": [
                    [
                        {
                            "node": "Cloudinary - Add Title to Image",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Cloudinary - Add Title to Image": {
                "main": [
                    [
                        {
                            "node": "Google Sheets - Write Results",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        },
        "staticData": None,
        "tags": [],
        "triggerCount": 0,
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "versionId": "1"
    }
    
    return workflow
