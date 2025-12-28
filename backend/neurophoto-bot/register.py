#!/usr/bin/env python3
"""
Регистрация бота Нейрофотосессия в базе данных через API
Запускается один раз для настройки бота
"""
import json
import urllib.request
import urllib.parse

# Конфигурация
BOT_TOKEN = "8346998195:AAFZBCS2xPHCT-_AY191Fqr3TGpZ59HUKWg"
BOT_NAME = "Нейрофотосессия PRO"
BOT_DESCRIPTION = "AI-бот для генерации профессиональных изображений через DALL-E 3, FLUX и Stable Diffusion"
WEBHOOK_URL = "https://functions.poehali.dev/deae2fef-4b07-485f-85ae-56450c446d2f"
BOTS_API_URL = "https://functions.poehali.dev/96b3f1ab-3e6d-476d-9886-020600efada2"

print("🚀 Регистрация бота Нейрофотосессия PRO\n")

# Шаг 1: Получить информацию о боте из Telegram
print("📋 Шаг 1: Проверка бота в Telegram...")
telegram_info_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"

try:
    with urllib.request.urlopen(telegram_info_url) as response:
        result = json.loads(response.read().decode('utf-8'))
        if result.get('ok'):
            bot_info = result.get('result', {})
            print(f"   ✅ Бот найден: @{bot_info.get('username')}")
            print(f"   📝 Имя: {bot_info.get('first_name')}")
        else:
            print(f"   ❌ Ошибка: {result}")
            exit(1)
except Exception as e:
    print(f"   ❌ Не удалось подключиться к Telegram API: {e}")
    exit(1)

# Шаг 2: Зарегистрировать бота в базе данных
print("\n📝 Шаг 2: Регистрация в базе данных...")
bot_data = {
    "name": BOT_NAME,
    "description": BOT_DESCRIPTION,
    "telegram_token": BOT_TOKEN,
    "ai_model": "openai/dall-e-3",
    "ai_prompt": "You are a professional AI image generator. Create high-quality images based on user descriptions."
}

data = json.dumps(bot_data).encode('utf-8')
req = urllib.request.Request(
    BOTS_API_URL,
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        if 'bot' in result:
            bot_id = result['bot'].get('id')
            print(f"   ✅ Бот зарегистрирован с ID: {bot_id}")
        else:
            print(f"   ⚠️  Возможно, бот уже существует: {result}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ❌ Ошибка HTTP {e.code}: {error_body}")
    if "already exists" not in error_body.lower():
        exit(1)
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    exit(1)

# Шаг 3: Настроить webhook
print("\n🔗 Шаг 3: Настройка webhook...")
telegram_webhook_url = f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook"
webhook_data = json.dumps({
    "url": WEBHOOK_URL,
    "drop_pending_updates": True,
    "allowed_updates": ["message"]
}).encode('utf-8')

req = urllib.request.Request(
    telegram_webhook_url,
    data=webhook_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        if result.get('ok'):
            print(f"   ✅ Webhook настроен: {WEBHOOK_URL}")
        else:
            print(f"   ❌ Ошибка: {result}")
            exit(1)
except Exception as e:
    print(f"   ❌ Не удалось настроить webhook: {e}")
    exit(1)

# Шаг 4: Проверка webhook
print("\n🔍 Шаг 4: Проверка webhook...")
telegram_check_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo"

try:
    with urllib.request.urlopen(telegram_check_url) as response:
        result = json.loads(response.read().decode('utf-8'))
        if result.get('ok'):
            webhook_info = result.get('result', {})
            print(f"   ✅ Webhook активен")
            print(f"   📍 URL: {webhook_info.get('url')}")
            print(f"   📊 Ожидающих обновлений: {webhook_info.get('pending_update_count', 0)}")
        else:
            print(f"   ❌ Ошибка: {result}")
except Exception as e:
    print(f"   ❌ Ошибка проверки: {e}")

print("\n✅ Настройка завершена!")
print(f"\n🤖 Найдите бота в Telegram: @{bot_info.get('username')}")
print("💬 Отправьте команду /start для проверки")
print("\n📝 Тестовый запрос: 'Портрет девушки с голубыми глазами'")
