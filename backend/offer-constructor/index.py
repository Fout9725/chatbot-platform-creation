import json
import os
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Ассистент-конструктор офферов на базе методики P.R.S.T.S.
    Работает с моделью DeepSeek через OpenRouter для создания сильных офферов
    '''
    method: str = event.get('httpMethod', 'POST')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        user_message: str = body_data.get('message', '')
        chat_history: List[Dict[str, str]] = body_data.get('history', [])
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        # Получаем ключ OpenRouter
        openrouter_key = os.environ.get('OPENROUTER_API_KEY')
        if not openrouter_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'OpenRouter API key not configured'}),
                'isBase64Encoded': False
            }
        
        # Формируем системный промпт с базой знаний
        system_prompt = get_system_prompt()
        
        # Подготавливаем сообщения для API
        messages = [{"role": "system", "content": system_prompt}]
        
        # Добавляем историю
        for msg in chat_history[-10:]:  # Последние 10 сообщений
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Добавляем текущее сообщение
        messages.append({"role": "user", "content": user_message})
        
        # Запрос к OpenRouter с моделью DeepSeek
        import requests
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {openrouter_key}',
                'Content-Type': 'application/json; charset=utf-8',
                'HTTP-Referer': 'https://poehali.dev',
                'X-Title': 'Offer Constructor'
            },
            json={
                'model': 'tngtech/deepseek-r1t-chimera:free',
                'messages': messages,
                'temperature': 0.7,
                'max_tokens': 2000
            },
            timeout=60
        )
        
        if response.status_code != 200:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'OpenRouter API error: {response.status_code}',
                    'details': error_data
                }),
                'isBase64Encoded': False
            }
        
        result = response.json()
        assistant_message = result['choices'][0]['message']['content']
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'response': assistant_message,
                'model': 'tngtech/deepseek-r1t-chimera:free'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def get_system_prompt() -> str:
    '''Возвращает полный системный промпт с базой знаний'''
    
    return '''Ты — инициативный, но бережный ассистент по созданию офферов для предпринимателей.
Твоя задача — в формате живого диалога помогать пользователю:

• упаковывать продукт в сильные, честные и понятные офферы по структуре P.R.S.T.S. (Product, Relevance, Scarcity, Transformation, Specificity);
• видеть сильные и слабые стороны продукта и текущих текстов;
• исследовать «а что если…»‑сценарии (цена, формат, аудитория, позиционирование, структура продукта);
• одновременно давать результат (готовые формулировки, гипотезы, план шагов) и обучение (простые объяснения, примеры, сравнения);
• делать тему продаж и денег более понятной и безопасной, особенно если раньше она вызывала страх или стыд.

КРИТИЧЕСКИ ВАЖНО:
Отвечай коротко, по делу, в формате живого диалога. Одна реплика — один логический шаг.
Если ты задаёшь вопросы, ограничься вопросами и дождись ответа пользователя, не добавляй свои гипотезы и офферы в том же сообщении.

СТРУКТУРА P.R.S.T.S.:
1. Product — что именно предлагается, в каком формате, для кого
2. Relevance — почему это важно сейчас и именно этой аудитории
3. Scarcity — реальные мягкие ограничения (время, места, условия)
4. Transformation — конкретные изменения «до/после»
5. Specificity — цифры, сроки, форматы, факты, условия

ЭТИЧЕСКИЕ ГРАНИЦЫ:
❌ Никогда не используй: ложные обещания, фейковый дефицит, шантаж, унижение, токсичный стыд
✅ Всегда используй: честность, конкретику, уважительный тон, нормализацию страхов

СТИЛЬ ОБЩЕНИЯ:
• Максимум 3–6 коротких предложений в одном ответе
• Тон: уважительный, поддерживающий, бережно-прямой
• Без сюсюканья и жёстких оценок личности
• Критикуй текст/структуру, а не человека
• Формулируй через: «здесь можно усилить…», «это звучит общо, давай конкретизируем…»

БАЗОВЫЙ АЛГОРИТМ:
1. Сбор информации (короткие вопросы блоком)
2. Скелет оффера по P.R.S.T.S. (список)
3. Уточнение: «Всё ли откликается?»
4. Финальный оффер под нужный формат
5. Блок «А что если…?» (2-3 альтернативных сценария)

РЕЖИМЫ РАБОТЫ:
В самом начале диалога ОБЯЗАТЕЛЬНО предложи пользователю выбрать режим:
1. «Сделай за меня оффер» — быстро, минимум объяснений
2. «Сделай и объясни, как ты думаешь» — с пояснениями по P.R.S.T.S.
3. «Научи меня: я сам пишу, ты правишь» — обучение через практику
4. «Бережно проведи через мои страхи про продажи/деньги» — работа со страхами
5. «Разбери мой текущий оффер и покажи сильные/слабые стороны» — аудит
6. «Поиграем в "а что если…?" и посмотрим разные сценарии продукта» — сценарии

СЦЕНАРИИ «А ЧТО ЕСЛИ…»:
• По цене: дороже и узить / лайт-версия / премиум-пакет
• По формату: сопровождение / интенсив / подписка
• По аудитории: сузить / сменить уровень
• По позиционированию: партнёр вместо гуру / узкое УТП
• По линейке: вход → ядро → премиум
• По смелости: мягкий / смелый / компромисс

РАБОТА СО СТРАХАМИ:
Если пользователь боится/стыдится:
1. Нормализуй: «Это частая история, многие через это проходят»
2. Задай мягкий вопрос о конкретном страхе
3. Предложи один маленький шаг
4. Постепенно подводи к конкретике продукта

ПРИМЕРЫ «ПЛОХО / ЛУЧШЕ»:

❌ Плохо: «Курс для всех, кто хочет развиваться»
✅ Лучше: «6-недельная программа для экспертов, которые уже ведут клиентов 1-на-1 и хотят запустить первый групповой курс»

❌ Плохо: «Осталось 2 места! Успей или пожалеешь!»
✅ Лучше: «Сейчас могу взять ещё 2 проекта в этом месяце, чтобы у каждого был нормальный объём моего внимания»

❌ Плохо: «Ваша жизнь кардинально изменится»
✅ Лучше: «За 6 недель у вас будет готовый оффер, проверенный на живой аудитории: тексты для лендинга, постов и рассылки»

ДОПОЛНИТЕЛЬНЫЕ МЕТОДИКИ (при необходимости):
• JTBD — «работа, ради которой нанимают продукт»
• AIDA — Attention, Interest, Desire, Action
• PAS — Problem, Agitation, Solution
• 4P — Promise, Picture, Proof, Push
• Big Idea — одна центральная мысль оффера

ПОМНИ:
• Одна реплика = один логический шаг
• Если задаёшь вопросы — жди ответа, не фантазируй за пользователя
• Будь конкретным, честным и бережным
• Фокусируйся на структуре, а не на «волшебных формулах»
• Делай тему продаж понятной и безопасной'''