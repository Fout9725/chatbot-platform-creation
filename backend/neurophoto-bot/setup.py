#!/usr/bin/env python3
"""
Скрипт для регистрации бота Нейрофотосессия в базе данных и настройки webhook
"""
import json
import urllib.request
import os

# Конфигурация
BOT_TOKEN = "8257588939:AAEYZYndyra3FLca5VpIFRkk8gHH1GGd48w"
BOT_NAME = "Нейрофотосессия PRO"
BOT_DESCRIPTION = "AI-бот для генерации профессиональных изображений через DALL-E 3"
WEBHOOK_URL = "https://functions.poehali.dev/deae2fef-4b07-485f-85ae-56450c446d2f"
BOTS_API_URL = "https://functions.poehali.dev/96b3f1ab-3e6d-476d-9886-020600efada2"

def register_bot():
    """Регистрация бота в базе данных"""
    data = json.dumps({
        "name": BOT_NAME,
        "description": BOT_DESCRIPTION,
        "telegram_token": BOT_TOKEN,
        "ai_model": "openai/dall-e-3",
        "ai_prompt": "You are an AI image generator. Create professional high-quality images based on user descriptions."
    }).encode('utf-8')
    
    req = urllib.request.Request(
        BOTS_API_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("✅ Бот зарегистрирован в базе данных:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return True
    except Exception as e:
        print(f"❌ Ошибка регистрации бота: {e}")
        return False

def set_webhook():
    """Настройка webhook для бота"""
    telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook"
    data = json.dumps({
        "url": WEBHOOK_URL,
        "drop_pending_updates": True
    }).encode('utf-8')
    
    req = urllib.request.Request(
        telegram_url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("\n✅ Webhook настроен:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return True
    except Exception as e:
        print(f"❌ Ошибка настройки webhook: {e}")
        return False

def get_bot_info():
    """Получение информации о боте"""
    telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
    
    try:
        with urllib.request.urlopen(telegram_url) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("\n📋 Информация о боте:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return True
    except Exception as e:
        print(f"❌ Ошибка получения информации: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск настройки бота Нейрофотосессия...\n")
    
    # Шаг 1: Получить информацию о боте
    if not get_bot_info():
        print("\n❌ Не удалось подключиться к боту. Проверьте токен.")
        exit(1)
    
    # Шаг 2: Зарегистрировать в базе данных
    if not register_bot():
        print("\n⚠️ Возможно, бот уже зарегистрирован.")
    
    # Шаг 3: Настроить webhook
    if not set_webhook():
        print("\n❌ Не удалось настроить webhook.")
        exit(1)
    
    print("\n✅ Настройка завершена! Бот готов к работе.")
    print(f"\n🤖 Найдите бота в Telegram и отправьте /start")