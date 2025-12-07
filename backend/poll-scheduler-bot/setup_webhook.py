import os
import requests

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '8059737467:AAEywpOOuZBvzCu35gSqZetsxgZzwULHCjc')
WEBHOOK_URL = 'https://functions.poehali.dev/dee8fe93-01c0-4f74-92c1-a23ec5c6c5f7'

def set_webhook():
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/setWebhook'
    data = {'url': WEBHOOK_URL}
    
    response = requests.post(url, json=data)
    result = response.json()
    
    print(f"setWebhook response: {result}")
    return result

def get_webhook_info():
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo'
    response = requests.get(url)
    result = response.json()
    
    print(f"getWebhookInfo response: {result}")
    return result

if __name__ == '__main__':
    print("Setting webhook...")
    set_webhook()
    print("\nGetting webhook info...")
    get_webhook_info()
