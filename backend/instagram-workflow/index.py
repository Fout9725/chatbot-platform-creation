import json
import os
import urllib.request
import urllib.error
from templates import TEMPLATES

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}

def handler(event: dict, context) -> dict:
    '''Генерирует готовый n8n workflow для автоматизации Instagram-постов или возвращает готовые шаблоны'''
    
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
            'body': ''
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        action = params.get('action', 'templates')
        
        if action == 'templates':
            catalog = []
            for key, tpl in TEMPLATES.items():
                catalog.append({
                    'id': key,
                    'name': tpl['name'],
                    'description': tpl['description'],
                    'category': tpl['category'],
                    'icon': tpl['icon'],
                    'nodes_count': tpl['nodes_count'],
                    'integrations': tpl['integrations'],
                    'difficulty': tpl['difficulty']
                })
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'templates': catalog})
            }
        
        if action == 'template':
            template_id = params.get('id', '')
            if template_id not in TEMPLATES:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Шаблон не найден'})
                }
            tpl = TEMPLATES[template_id]
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'template': tpl})
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неизвестное действие'})
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        action = body.get('action', 'generate')
        
        if action == 'validate_keys':
            return validate_api_keys(body)
        
        if action == 'apply_template':
            return apply_template(body)
        
        google_sheet_id = body.get('googleSheetId', '')
        anthropic_key = body.get('anthropicApiKey', '')
        openai_key = body.get('openaiApiKey', '')
        cloudinary_cloud = body.get('cloudinaryCloudName', '')
        cloudinary_key = body.get('cloudinaryApiKey', '')
        cloudinary_secret = body.get('cloudinaryApiSecret', '')
        schedule_time = body.get('scheduleTime', '10:00')
        
        if not all([google_sheet_id, openai_key]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Обязательные поля: googleSheetId, openaiApiKey'})
            }
        
        workflow = generate_instagram_workflow(
            google_sheet_id, anthropic_key, openai_key,
            cloudinary_cloud, cloudinary_key, cloudinary_secret, schedule_time
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'workflow': workflow})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def validate_api_keys(body: dict) -> dict:
    '''Проверяет валидность API-ключей через реальные запросы к провайдерам'''
    results = {}

    anthropic_key = body.get('anthropicApiKey', '').strip()
    if anthropic_key:
        results['anthropic'] = _check_anthropic(anthropic_key)

    openai_key = body.get('openaiApiKey', '').strip()
    if openai_key:
        results['openai'] = _check_openai(openai_key)

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'results': results})
    }


def _check_anthropic(key: str) -> dict:
    payload = json.dumps({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 1,
        "messages": [{"role": "user", "content": "hi"}]
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return {"valid": True, "message": "Ключ работает"}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode('utf-8', errors='replace')
        if e.code == 401:
            return {"valid": False, "message": "Неверный ключ"}
        if e.code == 403:
            return {"valid": False, "message": "Ключ заблокирован или нет доступа"}
        if e.code == 429:
            return {"valid": True, "message": "Ключ валиден (лимит запросов)"}
        return {"valid": False, "message": f"Ошибка API ({e.code})"}
    except Exception:
        return {"valid": False, "message": "Не удалось подключиться к Anthropic"}


def _check_openai(key: str) -> dict:
    req = urllib.request.Request(
        "https://api.openai.com/v1/models",
        headers={"Authorization": f"Bearer {key}"}
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode())
        has_dalle = any("dall-e" in m.get("id", "") for m in data.get("data", []))
        if has_dalle:
            return {"valid": True, "message": "Ключ работает, DALL-E доступен"}
        return {"valid": True, "message": "Ключ работает (DALL-E не найден в доступных моделях)"}
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return {"valid": False, "message": "Неверный ключ"}
        if e.code == 429:
            return {"valid": True, "message": "Ключ валиден (лимит запросов)"}
        return {"valid": False, "message": f"Ошибка API ({e.code})"}
    except Exception:
        return {"valid": False, "message": "Не удалось подключиться к OpenAI"}


def apply_template(body: dict) -> dict:
    '''Применяет готовый шаблон с пользовательскими данными'''
    template_id = body.get('templateId', '')
    user_params = body.get('params', {})
    
    if template_id not in TEMPLATES:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Шаблон не найден'})
        }
    
    tpl = TEMPLATES[template_id]
    required = tpl.get('required_params', [])
    missing = [p for p in required if not user_params.get(p)]
    if missing:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Не заполнены обязательные поля: {", ".join(missing)}'})
        }
    
    workflow_json = json.dumps(tpl['workflow'])
    for key, value in user_params.items():
        placeholder = f'{{{{USER_{key.upper()}}}}}'
        workflow_json = workflow_json.replace(placeholder, str(value))
    
    workflow = json.loads(workflow_json)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'workflow': workflow})
    }


def generate_instagram_workflow(
    sheet_id: str, anthropic_key: str, openai_key: str,
    cloudinary_cloud: str, cloudinary_key: str, cloudinary_secret: str,
    schedule_time: str
) -> dict:
    '''Создаёт полноценный n8n workflow JSON для Instagram-автопилота'''
    
    hour, minute = schedule_time.split(':')
    
    workflow = {
        "meta": {
            "instanceId": "instagram-autopilot-generated",
            "templateCredsSetupCompleted": True
        },
        "name": "Instagram Content Autopilot",
        "tags": [
            {"name": "Instagram"},
            {"name": "Content"},
            {"name": "Automation"}
        ],
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
                "typeVersion": 1.1,
                "position": [250, 300],
                "id": "schedule-trigger"
            },
            {
                "parameters": {
                    "operation": "read",
                    "sheetId": {"__rl": True, "value": sheet_id, "mode": "id"},
                    "range": "A:E",
                    "options": {"returnAllMatches": True}
                },
                "name": "Google Sheets - Read Ideas",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 4.5,
                "position": [480, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": "CONFIGURE_IN_N8N",
                        "name": "Google Sheets account"
                    }
                },
                "id": "google-sheets-read"
            },
            {
                "parameters": {
                    "conditions": {
                        "options": {"caseSensitive": True, "leftValue": ""},
                        "conditions": [
                            {
                                "id": "cond-idea",
                                "leftValue": "={{ $json['A'] }}",
                                "rightValue": "",
                                "operator": {"type": "string", "operation": "isNotEmpty"}
                            },
                            {
                                "id": "cond-empty-b",
                                "leftValue": "={{ $json['B'] }}",
                                "rightValue": "",
                                "operator": {"type": "string", "operation": "isEmpty"}
                            }
                        ],
                        "combinator": "and"
                    },
                    "options": {}
                },
                "name": "Filter - Only New Ideas",
                "type": "n8n-nodes-base.filter",
                "typeVersion": 2,
                "position": [700, 300],
                "id": "filter-new-ideas"
            },
            {
                "parameters": {
                    "method": "POST",
                    "url": "https://api.anthropic.com/v1/messages",
                    "authentication": "predefinedCredentialType",
                    "nodeCredentialType": "httpHeaderAuth",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {"name": "x-api-key", "value": anthropic_key},
                            {"name": "anthropic-version", "value": "2023-06-01"},
                            {"name": "content-type", "value": "application/json"}
                        ]
                    },
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": json.dumps({
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 2000,
                        "temperature": 0.7,
                        "messages": [
                            {
                                "role": "user",
                                "content": "Создай пост для Instagram по идее: {{ $json['A'] }}\n\nТребования:\n1. Заголовок: 5-10 слов, БЕЗ эмодзи\n2. Текст: 1600-1700 символов с пробелами\n3. Стиль: эмоциональный, личный опыт, история\n4. Структура: заголовок, 2-3 абзаца, призыв к действию, 5-7 хэштегов\n\nОтвет СТРОГО в JSON:\n{\"title\": \"заголовок\", \"text\": \"полный текст\"}"
                            }
                        ]
                    }),
                    "options": {
                        "timeout": 60000,
                        "response": {"response": {"fullResponse": False}}
                    }
                },
                "name": "Claude - Generate Text",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [920, 300],
                "id": "claude-api",
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "mode": "runOnceForEachItem",
                    "jsCode": "const resp = $input.item.json;\nif (!resp?.content?.[0]?.text) throw new Error('Empty Claude response');\nconst raw = resp.content[0].text;\nconst m = raw.match(/\\{[\\s\\S]*\\}/);\nif (!m) throw new Error('No JSON in response');\nconst d = JSON.parse(m[0]);\nif (!d.title || !d.text) throw new Error('Missing title/text');\nreturn {\n  json: {\n    idea: $('Filter - Only New Ideas').item.json['A'],\n    rowIndex: $('Filter - Only New Ideas').item.json['row_number'] || $itemIndex + 2,\n    title: d.title,\n    text: d.text\n  }\n};"
                },
                "name": "Parse Claude Response",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [1140, 300],
                "id": "parse-claude",
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "method": "POST",
                    "url": "https://api.openai.com/v1/images/generations",
                    "authentication": "predefinedCredentialType",
                    "nodeCredentialType": "httpHeaderAuth",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {"name": "Authorization", "value": f"Bearer {openai_key}"},
                            {"name": "Content-Type", "value": "application/json"}
                        ]
                    },
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": "={{ JSON.stringify({\"model\": \"dall-e-3\", \"prompt\": \"Create a vertical Instagram story image for: \" + $json.idea + \". Modern, vibrant, professional, no text.\", \"n\": 1, \"size\": \"1024x1792\", \"quality\": \"hd\"}) }}",
                    "options": {"timeout": 120000}
                },
                "name": "DALL-E 3 - Generate Image",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [1360, 300],
                "id": "dalle-generate",
                "onError": "continueErrorOutput"
            },
            {
                "parameters": {
                    "url": "={{ $json.data[0].url }}",
                    "options": {
                        "response": {"response": {"responseFormat": "file"}}
                    }
                },
                "name": "Download Generated Image",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [1580, 300],
                "id": "download-image",
                "onError": "continueErrorOutput"
            }
        ],
        "connections": {
            "Schedule Trigger": {
                "main": [[{"node": "Google Sheets - Read Ideas", "type": "main", "index": 0}]]
            },
            "Google Sheets - Read Ideas": {
                "main": [[{"node": "Filter - Only New Ideas", "type": "main", "index": 0}]]
            },
            "Filter - Only New Ideas": {
                "main": [[{"node": "Claude - Generate Text", "type": "main", "index": 0}]]
            },
            "Claude - Generate Text": {
                "main": [
                    [{"node": "Parse Claude Response", "type": "main", "index": 0}],
                    [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
                ]
            },
            "Parse Claude Response": {
                "main": [
                    [{"node": "DALL-E 3 - Generate Image", "type": "main", "index": 0}],
                    [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
                ]
            },
            "DALL-E 3 - Generate Image": {
                "main": [
                    [{"node": "Download Generated Image", "type": "main", "index": 0}],
                    [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1",
            "saveManualExecutions": True,
            "callerPolicy": "workflowsFromSameOwner",
            "errorWorkflow": ""
        },
        "pinData": {},
        "active": False
    }
    
    if cloudinary_cloud and cloudinary_key and cloudinary_secret:
        workflow["nodes"].append({
            "parameters": {
                "method": "POST",
                "url": f"https://api.cloudinary.com/v1_1/{cloudinary_cloud}/image/upload",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": json.dumps({
                    "file": "={{ $json.data }}",
                    "upload_preset": "ml_default",
                    "api_key": cloudinary_key,
                    "api_secret": cloudinary_secret,
                    "transformation": "l_text:Arial_60_bold:{{ $('Parse Claude Response').item.json.title }},co_white,g_south,y_100"
                }),
                "options": {"timeout": 60000}
            },
            "name": "Cloudinary - Overlay Title",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1800, 300],
            "id": "cloudinary-overlay",
            "onError": "continueErrorOutput"
        })
        
        workflow["connections"]["Download Generated Image"] = {
            "main": [
                [{"node": "Cloudinary - Overlay Title", "type": "main", "index": 0}],
                [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
            ]
        }
        
        image_url_expr = "={{ $('Cloudinary - Overlay Title').item.json.secure_url }}"
        update_prev_node = "Cloudinary - Overlay Title"
        
        workflow["connections"]["Cloudinary - Overlay Title"] = {
            "main": [
                [{"node": "Google Sheets - Save Results", "type": "main", "index": 0}],
                [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
            ]
        }
    else:
        image_url_expr = "={{ $('DALL-E 3 - Generate Image').item.json.data[0].url }}"
        update_prev_node = "Download Generated Image"
        
        workflow["connections"]["Download Generated Image"] = {
            "main": [
                [{"node": "Google Sheets - Save Results", "type": "main", "index": 0}],
                [{"node": "Error - Log to Sheet", "type": "main", "index": 0}]
            ]
        }
    
    workflow["nodes"].append({
        "parameters": {
            "operation": "update",
            "sheetId": {"__rl": True, "value": sheet_id, "mode": "id"},
            "range": f"=B{{{{ $json.rowIndex }}}}:E{{{{ $json.rowIndex }}}}",
            "options": {},
            "columns": {
                "mappingMode": "defineBelow",
                "value": {
                    "B": "={{ $('Parse Claude Response').item.json.text }}",
                    "C": image_url_expr,
                    "D": "={{ $now.format('DD.MM.YYYY HH:mm') }}",
                    "E": "Готово к модерации"
                }
            }
        },
        "name": "Google Sheets - Save Results",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [2020, 300],
        "credentials": {
            "googleSheetsOAuth2Api": {
                "id": "CONFIGURE_IN_N8N",
                "name": "Google Sheets account"
            }
        },
        "id": "save-results"
    })
    
    workflow["nodes"].append({
        "parameters": {
            "operation": "update",
            "sheetId": {"__rl": True, "value": sheet_id, "mode": "id"},
            "range": "=E2",
            "options": {},
            "columns": {
                "mappingMode": "defineBelow",
                "value": {
                    "E": "=ОШИБКА: {{ $json.error?.message || 'Неизвестная ошибка' }}"
                }
            }
        },
        "name": "Error - Log to Sheet",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1400, 560],
        "credentials": {
            "googleSheetsOAuth2Api": {
                "id": "CONFIGURE_IN_N8N",
                "name": "Google Sheets account"
            }
        },
        "id": "error-log"
    })
    
    return workflow