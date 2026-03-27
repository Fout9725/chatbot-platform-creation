import json
import os
import urllib.request

BOT_TOKEN = os.environ.get('EXPERT_BOT_TOKEN', '')
WEBHOOK_URL = "https://functions.poehali.dev/a795746d-3812-4427-898e-b756ff0edc4f"


def handler(event, context):
    """Устанавливает Telegram webhook для бота-распаковщика эксперта"""
    if event.get('httpMethod') == 'OPTIONS':
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

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    params = event.get('queryStringParameters') or {}
    webhook_url = params.get('url', WEBHOOK_URL)

    if not BOT_TOKEN:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({"error": "EXPERT_BOT_TOKEN not configured"})
        }

    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook"
    payload = json.dumps({"url": webhook_url}).encode('utf-8')
    req = urllib.request.Request(api_url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({"telegram_response": result, "webhook_url": webhook_url})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({"error": str(e)})
        }
