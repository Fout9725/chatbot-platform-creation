import json
import os

def handler(event: dict, context) -> dict:
    '''Генерирует готовый n8n workflow для автоматизации Instagram-постов с интеграцией Claude API, DALL-E и Cloudinary'''
    
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
        google_creds_id = body.get('googleCredentialsId', '')
        anthropic_key = body.get('anthropicApiKey', '')
        anthropic_creds_id = body.get('anthropicCredentialsId', '')
        openai_key = body.get('openaiApiKey', '')
        openai_creds_id = body.get('openaiCredentialsId', '')
        cloudinary_cloud = body.get('cloudinaryCloudName', '')
        cloudinary_key = body.get('cloudinaryApiKey', '')
        cloudinary_secret = body.get('cloudinaryApiSecret', '')
        cloudinary_creds_id = body.get('cloudinaryCredentialsId', '')
        instagram_creds_id = body.get('instagramCredentialsId', '')
        schedule_time = body.get('scheduleTime', '10:00')
        
        if not all([google_sheet_id, openai_key]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Обязательные поля: googleSheetId, openaiApiKey'})
            }
        
        workflow = generate_n8n_workflow(
            google_sheet_id,
            google_creds_id,
            anthropic_key,
            anthropic_creds_id,
            openai_key,
            openai_creds_id,
            cloudinary_cloud,
            cloudinary_key,
            cloudinary_secret,
            cloudinary_creds_id,
            instagram_creds_id,
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


def generate_n8n_workflow(
    sheet_id: str, 
    google_creds_id: str,
    anthropic_key: str,
    anthropic_creds_id: str,
    openai_key: str,
    openai_creds_id: str,
    cloudinary_cloud: str,
    cloudinary_key: str,
    cloudinary_secret: str,
    cloudinary_creds_id: str,
    instagram_creds_id: str,
    schedule_time: str
) -> dict:
    '''Создаёт полноценный n8n workflow JSON с обработкой ошибок'''
    
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
                "position": [250, 300],
                "id": "schedule-trigger"
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
                        "id": google_creds_id or "YOUR_GOOGLE_CREDENTIALS_ID",
                        "name": "Google Sheets account"
                    }
                },
                "id": "google-sheets-read",
                "continueOnFail": False
            },
            {
                "parameters": {
                    "conditions": {
                        "boolean": [
                            {
                                "value1": "={{ $json.A }}",
                                "operation": "isNotEmpty"
                            },
                            {
                                "value1": "={{ $json.B }}",
                                "operation": "isEmpty"
                            }
                        ]
                    }
                },
                "name": "Filter Empty Rows",
                "type": "n8n-nodes-base.if",
                "typeVersion": 1,
                "position": [650, 300],
                "id": "filter-empty"
            },
            {
                "parameters": {
                    "url": "https://api.anthropic.com/v1/messages",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "httpHeaderAuth",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "x-api-key",
                                "value": anthropic_key if anthropic_key else "={{ $credentials.anthropicApiKey }}"
                            },
                            {
                                "name": "anthropic-version",
                                "value": "2023-06-01"
                            }
                        ]
                    },
                    "sendBody": True,
                    "bodyParameters": {
                        "parameters": []
                    },
                    "specifyBody": "json",
                    "jsonBody": json.dumps({
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 2000,
                        "temperature": 0.7,
                        "messages": [
                            {
                                "role": "user",
                                "content": """Создай пост для Instagram по идее: {{ $json.A }}

Требования:
1. Заголовок: 5-10 слов, БЕЗ эмодзи, жирным шрифтом
2. Текст: 1600-1700 символов с пробелами
3. Стиль: эмоциональный, личный опыт, история
4. Структура:
   - Заголовок жирным
   - 2-3 абзаца основного текста
   - Призыв к действию (вопрос)
   - 5-7 хэштегов в конце

Формат ответа ТОЛЬКО JSON (без markdown):
{
  "title": "Заголовок без эмодзи",
  "text": "Полный текст поста 1600-1700 символов"
}"""
                            }
                        ]
                    }),
                    "options": {}
                },
                "name": "HTTP Request - Claude API",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [850, 300],
                "id": "claude-api-request",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "jsCode": """// Парсинг ответа от Claude API
const claudeResponse = $input.item.json;

if (!claudeResponse || !claudeResponse.content || !claudeResponse.content[0]) {
  throw new Error('Invalid Claude API response');
}

const textContent = claudeResponse.content[0].text;

// Извлекаем JSON из ответа (может быть в markdown блоке)
let jsonMatch = textContent.match(/\\{[\\s\\S]*\\}/);
if (!jsonMatch) {
  throw new Error('No JSON found in Claude response');
}

const parsedContent = JSON.parse(jsonMatch[0]);

if (!parsedContent.title || !parsedContent.text) {
  throw new Error('Missing title or text in Claude response');
}

// Передаём данные дальше
return {
  json: {
    idea: $input.first().json.A,
    rowNumber: $input.first().json.rowNumber || 2,
    title: parsedContent.title,
    text: parsedContent.text,
    originalClaudeResponse: claudeResponse
  }
};"""
                },
                "name": "Parse Claude Response",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [1050, 300],
                "id": "parse-claude",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "resource": "image",
                    "operation": "create",
                    "prompt": "=Create a vertical Instagram story image (1080x1920) for post about: {{ $json.idea }}. Style: modern, vibrant, eye-catching, professional. No text on image.",
                    "model": "dall-e-3",
                    "size": "1024x1792",
                    "quality": "hd",
                    "options": {}
                },
                "name": "DALL-E 3 - Generate Image",
                "type": "n8n-nodes-base.openAi",
                "typeVersion": 1.3,
                "position": [1250, 300],
                "credentials": {
                    "openAiApi": {
                        "id": openai_creds_id or "YOUR_OPENAI_CREDENTIALS_ID",
                        "name": "OpenAI account"
                    }
                },
                "id": "dalle-generate",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "url": "={{ $json.data[0].url }}",
                    "options": {
                        "response": {
                            "response": {
                                "responseFormat": "file"
                            }
                        }
                    }
                },
                "name": "Download Image from DALL-E",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [1450, 300],
                "id": "download-image",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "operation": "upload",
                    "cloudName": cloudinary_cloud or "your-cloud-name",
                    "binaryData": True,
                    "binaryPropertyName": "data",
                    "publicId": "=instagram_{{ $now.format('YYYYMMDD_HHmmss') }}",
                    "options": {
                        "transformation": [
                            {
                                "overlay": {
                                    "text": "={{ $('Parse Claude Response').item.json.title }}",
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
                "name": "Cloudinary - Add Title",
                "type": "n8n-nodes-base.cloudinary",
                "typeVersion": 1,
                "position": [1650, 300],
                "credentials": {
                    "cloudinaryApi": {
                        "id": cloudinary_creds_id or "YOUR_CLOUDINARY_CREDENTIALS_ID",
                        "name": "Cloudinary account"
                    }
                },
                "id": "cloudinary-upload",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "url": "https://graph.facebook.com/v18.0/{{ $env.INSTAGRAM_USER_ID }}/media",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "sendQuery": True,
                    "queryParameters": {
                        "parameters": [
                            {
                                "name": "image_url",
                                "value": "={{ $json.secure_url }}"
                            },
                            {
                                "name": "caption",
                                "value": "={{ $('Parse Claude Response').item.json.text }}"
                            }
                        ]
                    },
                    "options": {}
                },
                "name": "Instagram API - Create Media",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [1850, 300],
                "credentials": {
                    "oAuth2Api": {
                        "id": instagram_creds_id or "YOUR_INSTAGRAM_CREDENTIALS_ID",
                        "name": "Instagram Business account"
                    }
                },
                "id": "instagram-create-media",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "jsCode": """// Ждём 5 секунд перед публикацией (Instagram требует задержку)
await new Promise(resolve => setTimeout(resolve, 5000));

return $input.all();"""
                },
                "name": "Wait 5 Seconds",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [2050, 300],
                "id": "wait-delay"
            },
            {
                "parameters": {
                    "url": "https://graph.facebook.com/v18.0/{{ $env.INSTAGRAM_USER_ID }}/media_publish",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "sendQuery": True,
                    "queryParameters": {
                        "parameters": [
                            {
                                "name": "creation_id",
                                "value": "={{ $('Instagram API - Create Media').item.json.id }}"
                            }
                        ]
                    },
                    "options": {}
                },
                "name": "Instagram API - Publish",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [2250, 300],
                "credentials": {
                    "oAuth2Api": {
                        "id": instagram_creds_id or "YOUR_INSTAGRAM_CREDENTIALS_ID",
                        "name": "Instagram Business account"
                    }
                },
                "id": "instagram-publish",
                "continueOnFail": True,
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "operation": "update",
                    "sheetId": sheet_id,
                    "range": "=B{{ $('Parse Claude Response').item.json.rowNumber }}:E{{ $('Parse Claude Response').item.json.rowNumber }}",
                    "options": {},
                    "dataMode": "defineBelow",
                    "fieldsUi": {
                        "values": [
                            {
                                "column": "B",
                                "fieldValue": "={{ $('Parse Claude Response').item.json.text }}"
                            },
                            {
                                "column": "C",
                                "fieldValue": "={{ $('Cloudinary - Add Title').item.json.secure_url }}"
                            },
                            {
                                "column": "D",
                                "fieldValue": "={{ $now.format('DD.MM.YYYY HH:mm') }}"
                            },
                            {
                                "column": "E",
                                "fieldValue": "=https://www.instagram.com/p/{{ $json.id }}"
                            }
                        ]
                    }
                },
                "name": "Google Sheets - Update Status",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 3,
                "position": [2450, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": google_creds_id or "YOUR_GOOGLE_CREDENTIALS_ID",
                        "name": "Google Sheets account"
                    }
                },
                "id": "google-sheets-update"
            },
            {
                "parameters": {
                    "conditions": {
                        "boolean": []
                    }
                },
                "name": "Error Handler",
                "type": "n8n-nodes-base.if",
                "typeVersion": 1,
                "position": [1250, 500],
                "id": "error-handler"
            },
            {
                "parameters": {
                    "operation": "update",
                    "sheetId": sheet_id,
                    "range": "=E{{ $('Parse Claude Response').item.json.rowNumber || 2 }}",
                    "options": {},
                    "dataMode": "defineBelow",
                    "fieldsUi": {
                        "values": [
                            {
                                "column": "E",
                                "fieldValue": "=ERROR: {{ $json.error || 'Unknown error' }}"
                            }
                        ]
                    }
                },
                "name": "Log Error to Sheet",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 3,
                "position": [1450, 500],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": google_creds_id or "YOUR_GOOGLE_CREDENTIALS_ID",
                        "name": "Google Sheets account"
                    }
                },
                "id": "log-error"
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
                            "node": "Filter Empty Rows",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Filter Empty Rows": {
                "main": [
                    [
                        {
                            "node": "HTTP Request - Claude API",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "HTTP Request - Claude API": {
                "main": [
                    [
                        {
                            "node": "Parse Claude Response",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Parse Claude Response": {
                "main": [
                    [
                        {
                            "node": "DALL-E 3 - Generate Image",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
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
                            "node": "Download Image from DALL-E",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Download Image from DALL-E": {
                "main": [
                    [
                        {
                            "node": "Cloudinary - Add Title",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Cloudinary - Add Title": {
                "main": [
                    [
                        {
                            "node": "Instagram API - Create Media",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Instagram API - Create Media": {
                "main": [
                    [
                        {
                            "node": "Wait 5 Seconds",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Wait 5 Seconds": {
                "main": [
                    [
                        {
                            "node": "Instagram API - Publish",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Instagram API - Publish": {
                "main": [
                    [
                        {
                            "node": "Google Sheets - Update Status",
                            "type": "main",
                            "index": 0
                        }
                    ],
                    [
                        {
                            "node": "Error Handler",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "Error Handler": {
                "main": [
                    [
                        {
                            "node": "Log Error to Sheet",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        }
    }
    
    return workflow
