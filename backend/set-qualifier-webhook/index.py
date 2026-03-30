"""Устанавливает Telegram webhook для бота-квалификатора предпринимателей."""

import json
import os
import requests

BOT_TOKEN = os.environ.get("QUALIFIER_BOT_TOKEN", "")


def handler(event, context):
    """Установка webhook для qualifier-bot. Вызовите GET для автоматической настройки."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    qs = event.get("queryStringParameters") or {}
    webhook_url = qs.get("url", "")

    if not webhook_url:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Передайте ?url=<URL функции qualifier-bot>"}),
        }

    if not BOT_TOKEN:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "QUALIFIER_BOT_TOKEN not set"}),
        }

    resp = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
        json={"url": webhook_url},
        timeout=10,
    )
    result = resp.json()

    delete_commands = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/deleteMyCommands",
        timeout=10,
    )

    set_commands = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/setMyCommands",
        json={
            "commands": [
                {"command": "start", "description": "Запустить бота"},
                {"command": "restart", "description": "Начать сначала"},
                {"command": "help", "description": "Помощь"},
                {"command": "about", "description": "О боте"},
            ]
        },
        timeout=10,
    )

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "webhook_result": result,
            "commands_set": set_commands.json(),
            "webhook_url": webhook_url,
        }),
    }
