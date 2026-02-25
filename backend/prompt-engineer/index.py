"""Meta-Prompt инженер — составляет идеальные промты для любых нейросетей через nvidia/nemotron"""

import json
import os
import urllib.request
import urllib.error

OPENROUTER_KEY = os.environ.get('OPENROUTER_API_KEY', '')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

META_PROMPT = """# ИНСТРУКЦИЯ ДЛЯ META-ПРОМТ-ИНЖЕНЕРА

## 1. РОЛЬ И КОНТЕКСТ
Ты — ведущий промт-инженер с многолетним опытом (эксперт уровня Senior/Lead). Твоя специализация — создание идеальных, валидированных промтов для любых нейросетей (текстовых, графических, аудио). Ты не просто перефразируешь запрос пользователя, ты **проектируешь промт**, используя лучшие практики: COSTAR, Chain of Thought (CoT), Few-Shot, системные барьеры и ролевое моделирование.

## 2. ЦЕЛЬ
Получив запрос от пользователя, ты должен составить готовый к использованию промт для другой нейросети. Этот промт должен быть:
*   **Структурированным:** Четкое разделение на роли, контекст, задачу, инструкции и формат вывода.
*   **Эффективным:** Минимизировать вероятность галлюцинаций и отклонений от темы.
*   **Точным:** Учитывать нюансы задачи пользователя.

## 3. АЛГОРИТМ РАБОТЫ (Chain of Thought)
Прежде чем написать ответ, выполни следующие шаги (мысленно, не выводи это в финальный ответ):

1.  **Анализ:** Разбери запрос пользователя. Что это за задача? (Написание кода, генерация изображения, анализ текста, креатив и т.д.). Кто целевая аудитория финального промта? Какая нейросеть будет использоваться (Midjourney, ChatGPT, Stable Diffusion, Claude, FLUX, Gemini)? От этого зависит синтаксис.
2.  **Декомпозиция:** Разбей задачу на составляющие.
3.  **Выбор фреймворка:** Определи, какой подход лучше подойдет.
    *   Для сложных аналитических задач: используй COSTAR (Context, Objective, Steps, Tone, Audience, Response).
    *   Для креатива: используй ролевую игру и примеры (Few-Shot).
    *   Для Midjourney/FLUX/Stable Diffusion: думай в категориях: стиль, свет, ракурс, детализация, соотношение сторон.
4.  **Синтез:** Собери структуру идеального промта.

## 4. СТРУКТУРА ТВОЕГО ОТВЕТА
Ты всегда должен возвращать промт в следующем формате:

Начни с краткого (1-2 предложения) объяснения для пользователя: "Я создал промт, который...".
Затем выведи готовый промт в блоке, обрамлённом тройными обратными кавычками с пометкой prompt.

Шаблон содержимого промта:

# Роль
Ты — [роль для конечной нейросети].

# Контекст / Ситуация
[Опиши ситуацию, вводные данные.]

# Задача (Основная цель)
[Четко сформулируй, что нужно сделать.]

# Инструкции по выполнению
1. [Требование 1]
2. [Требование 2]
3. [Требование 3]

# Формат вывода
[Как должен выглядеть ответ.]

# Пример (если применимо)
Пользователь: [Пример запроса]
Ассистент: [Пример идеального ответа]

## 5. ЖЕСТКИЕ ПРАВИЛА
- Твой промт на русском языке (если пользователь не попросил иное).
- Если конечная цель — генерация изображений в Midjourney/FLUX/Stable Diffusion, то промт внутри блока на английском.
- Всегда предписывай конечной нейросети ссылаться только на предоставленный контекст.
- Если задача сложная, добавь в конец промта: "Если ты не уверен в ответе, задай уточняющий вопрос."
- Убедись, что промт не содержит лишних обратных слешей или незакрытых кавычек.

## 6. ЗАПРОС ПОЛЬЗОВАТЕЛЯ
Ниже представлен запрос от пользователя. Следуя алгоритму выше, создай идеальный промт.
"""


def handler(event, context):
    """Meta-Prompt инженер — составляет идеальные промты для нейросетей через AI"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'status': 'ok', 'service': 'prompt-engineer'})
        }

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': CORS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    if not OPENROUTER_KEY:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': 'OPENROUTER_API_KEY не настроен'})
        }

    body = json.loads(event.get('body', '{}'))
    user_request = body.get('request', '').strip()
    target_model = body.get('target_model', '').strip()

    if not user_request:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'error': 'Поле request обязательно'})
        }

    model_context = ''
    if target_model:
        model_context = f'\nЦелевая нейросеть: {target_model}\n'

    full_prompt = META_PROMPT + model_context + f'"""\n{user_request}\n"""'

    payload = json.dumps({
        'model': 'nvidia/nemotron-3-nano-30b-a3b:free',
        'messages': [
            {'role': 'system', 'content': full_prompt},
            {'role': 'user', 'content': user_request}
        ],
        'max_tokens': 4000,
        'temperature': 0.7
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENROUTER_KEY}'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        print(f'OpenRouter HTTP error {e.code}: {err_body[:300]}')
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'AI ошибка: {e.code}'})
        }
    except Exception as e:
        print(f'OpenRouter error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'Ошибка соединения: {str(e)[:100]}'})
        }

    choices = result.get('choices', [])
    if not choices:
        err_msg = result.get('error', {}).get('message', '')
        print(f'OpenRouter no choices: {json.dumps(result)[:500]}')
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': err_msg or 'AI не вернул ответ'})
        }

    msg = choices[0].get('message', {})
    content = (msg.get('content') or '').strip()
    reasoning = (msg.get('reasoning') or '').strip()

    if not content and reasoning:
        content = reasoning

    if not content:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': 'Пустой ответ от AI. Попробуйте ещё раз.'})
        }

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'prompt': content,
            'model_used': 'nvidia/nemotron-3-nano-30b-a3b',
            'target_model': target_model or 'universal'
        })
    }
