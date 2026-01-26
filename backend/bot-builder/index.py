import json
import os
import urllib.request
from typing import Dict, Any
from knowledge_base import BOT_BUILDING_KNOWLEDGE

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''ИИ-агент для автоматического создания ботов по текстовому описанию'''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_str = event.get('body', '')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        
        body_data = json.loads(body_str)
        user_prompt = body_data.get('prompt', '')
        mode = body_data.get('mode', 'visual')
        conversation_history = body_data.get('history', [])
        user_id = event.get('headers', {}).get('X-User-Id', 'anonymous')
        
        if not user_prompt:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Prompt is required'})
            }
        
        openrouter_key = os.environ.get('OPENROUTER_API_KEY', '')
        
        if not openrouter_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'AI service temporarily unavailable'})
            }
        
        # Используем сокращенную базу знаний если это первый запрос
        use_full_knowledge = len(conversation_history) > 0
        
        knowledge_snippet = BOT_BUILDING_KNOWLEDGE if use_full_knowledge else """
# Краткая база: Создание ботов

## ВИЗУАЛЬНЫЙ (N8N):
Ноды: Telegram Trigger → AI Agent (OpenAI + Memory) → Telegram Response
RAG: Document → Embeddings → Vector Store → Search → AI Agent

## ПРОФЕССИОНАЛЬНЫЙ (Python):
```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters

async def start(update, context):
    await update.message.reply_text('Привет!')

async def handle_message(update, context):
    user_msg = update.message.text
    await update.message.reply_text(f'Вы сказали: {user_msg}')

app = Application.builder().token("TOKEN").build()
app.add_handler(CommandHandler("start", start))
app.add_handler(MessageHandler(filters.TEXT, handle_message))
app.run_polling()
```
"""
        
        system_prompt = f"""Ты — экспертный ИИ-агент для автоматического создания ботов в платформе ИнтеллектПро.

**Текущий режим:** {'Визуальный конструктор (N8N)' if mode == 'visual' else 'Профессиональный режим (Код)'}

**Твоя база знаний:**
{knowledge_snippet}

**Твои задачи:**
1. Понимать запрос пользователя и определять тип бота
2. Генерировать ПОЛНУЮ конфигурацию бота в режиме реального времени
3. Объяснять что делает каждый компонент
4. Предлагать улучшения и best practices
5. Отвечать на вопросы об изменениях

**Формат ответа для ВИЗУАЛЬНОГО режима:**
Возвращай JSON конфигурацию в формате:
```json
{{
  "botName": "Название бота",
  "description": "Описание что делает бот",
  "nodes": [
    {{
      "id": "node1",
      "type": "Telegram Trigger",
      "label": "Получение сообщения",
      "position": {{"x": 100, "y": 100}},
      "config": {{
        "botToken": "{{TELEGRAM_BOT_TOKEN}}"
      }}
    }},
    {{
      "id": "node2",
      "type": "AI Agent",
      "label": "Обработка AI",
      "position": {{"x": 300, "y": 100}},
      "config": {{
        "model": "OpenAI Chat Model",
        "systemPrompt": "Твой промпт здесь",
        "memory": "Simple Memory"
      }}
    }}
  ],
  "connections": [
    {{"from": "node1", "to": "node2"}},
    {{"from": "node2", "to": "node3"}}
  ],
  "explanation": "Пошаговое объяснение логики бота",
  "nextSteps": ["Шаг 1", "Шаг 2"]
}}
```

**Формат ответа для ПРОФЕССИОНАЛЬНОГО режима:**
Возвращай JSON с кодом:
```json
{{
  "botName": "Название бота",
  "description": "Описание",
  "language": "python",
  "code": "Полный код бота",
  "dependencies": ["python-telegram-bot", "openai"],
  "envVars": ["TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY"],
  "setupInstructions": "Пошаговая инструкция по запуску",
  "explanation": "Объяснение ключевых частей кода",
  "nextSteps": ["Что сделать дальше"]
}}
```

**Важные правила:**
- ВСЕГДА генерируй полную рабочую конфигурацию/код
- Используй best practices из базы знаний
- Объясняй сложные моменты простым языком
- Предлагай конкретные улучшения
- Если пользователь просит изменения - применяй их к предыдущей версии

**Примеры типичных запросов:**
1. "Создай бота для службы поддержки" → RAG bot с Telegram + AI Agent
2. "Нужен бот для приема заказов" → ConversationHandler с кнопками
3. "Бот для рассылки новостей" → Schedule trigger + массовая рассылка
4. "Добавь кнопки меню" → Изменение существующего кода/конфигурации

Отвечай ТОЛЬКО в формате JSON как указано выше. Будь конкретным и практичным."""

        messages = [{'role': 'system', 'content': system_prompt}]
        
        for msg in conversation_history:
            messages.append({'role': msg['role'], 'content': msg['content']})
        
        messages.append({'role': 'user', 'content': user_prompt})
        
        request_data = {
            'model': 'tngtech/deepseek-r1t2-chimera:free',
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 1500,
            'stream': False
        }
        
        api_url = 'https://openrouter.ai/api/v1/chat/completions'
        
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                print(f'Bot Builder AI request (attempt {attempt + 1}/{max_retries})')
                print(f'User: {user_id}, Mode: {mode}, Prompt length: {len(user_prompt)}')
                
                req = urllib.request.Request(
                    api_url,
                    data=json.dumps(request_data).encode('utf-8'),
                    headers={
                        'Authorization': f'Bearer {openrouter_key}',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://intellectpro.ru',
                        'X-Title': 'IntellektPro Bot Builder'
                    },
                    method='POST'
                )
                
                response = urllib.request.urlopen(req, timeout=120)
                response_data = json.loads(response.read().decode('utf-8'))
                
                ai_response = response_data['choices'][0]['message']['content']
                print(f'AI response length: {len(ai_response)} chars')
                
                import re
                ai_response = re.sub(r'<think>.*?</think>', '', ai_response, flags=re.DOTALL | re.IGNORECASE)
                ai_response = re.sub(r'<thinking>.*?</thinking>', '', ai_response, flags=re.DOTALL | re.IGNORECASE)
                
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', ai_response, re.DOTALL)
                if json_match:
                    ai_response = json_match.group(1)
                
                ai_response = ai_response.strip()
                if ai_response.startswith('```json'):
                    ai_response = ai_response[7:]
                if ai_response.startswith('```'):
                    ai_response = ai_response[3:]
                if ai_response.endswith('```'):
                    ai_response = ai_response[:-3]
                ai_response = ai_response.strip()
                
                try:
                    parsed_response = json.loads(ai_response)
                except json.JSONDecodeError:
                    parsed_response = {
                        'botName': 'Сгенерированный бот',
                        'description': 'Бот создан по вашему запросу',
                        'rawResponse': ai_response,
                        'isPlainText': True
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'botConfig': parsed_response,
                        'mode': mode,
                        'timestamp': context.request_id if hasattr(context, 'request_id') else 'unknown'
                    })
                }
                
            except urllib.error.HTTPError as e:
                print(f'HTTP ERROR in bot-builder (attempt {attempt + 1}): {e.code} {str(e)}')
                if e.code == 429:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'success': False,
                            'error': 'Превышен лимит запросов к AI. Попробуйте через минуту.'
                        })
                    }
                if attempt < max_retries - 1:
                    continue
                    
            except Exception as e:
                print(f'ERROR in bot-builder (attempt {attempt + 1}): {str(e)}')
                import traceback
                print(f'Traceback: {traceback.format_exc()}')
                
                if 'timeout' in str(e).lower() and attempt < max_retries - 1:
                    continue
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': False,
                'error': 'Не удалось сгенерировать бота. Попробуйте упростить запрос или повторите позже.'
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }