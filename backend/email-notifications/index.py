'''
Business: Отправка email-уведомлений пользователям при регистрации и других событиях
Args: event с httpMethod, body содержащим email, subject, message, user_data
Returns: HTTP response с статусом отправки
'''

import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    to_email = body_data.get('email')
    email_type = body_data.get('type', 'registration')
    user_data = body_data.get('user_data', {})
    
    if not to_email:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Email is required'}),
            'isBase64Encoded': False
        }
    
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not smtp_email or not smtp_password:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'SMTP credentials not configured'}),
            'isBase64Encoded': False
        }
    
    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_email
    msg['To'] = to_email
    
    if email_type == 'registration':
        msg['Subject'] = '🎉 Добро пожаловать в Chatbot Platform!'
        
        login = user_data.get('login', to_email)
        password = user_data.get('password', 'Установите пароль в личном кабинете')
        
        html_body = f'''
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0;">Добро пожаловать!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px;">
              <h2 style="color: #333;">Ваша регистрация успешно завершена</h2>
              <p style="color: #666; font-size: 16px;">Спасибо за регистрацию на нашей платформе ИИ-ботов!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">Данные для входа:</h3>
                <p style="margin: 10px 0;"><strong>Логин:</strong> {login}</p>
                <p style="margin: 10px 0;"><strong>Email:</strong> {to_email}</p>
                <p style="margin: 10px 0;"><strong>Пароль:</strong> {password}</p>
              </div>
              
              <div style="background: #fffbeb; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">⚠️ <strong>Важно:</strong> Сохраните эти данные в надёжном месте!</p>
              </div>
              
              <a href="https://your-platform.com/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">
                Войти на платформу
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Если у вас возникли вопросы, свяжитесь с нами: support@chatbot-platform.ru
            </p>
          </body>
        </html>
        '''
        
        msg.attach(MIMEText(html_body, 'html'))
    
    elif email_type == '2fa_code':
        code = user_data.get('code', '000000')
        msg['Subject'] = '🔐 Код подтверждения входа'
        
        html_body = f'''
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #667eea; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0;">Код подтверждения</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; text-align: center;">
              <p style="color: #666; font-size: 16px;">Ваш код для входа:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">{code}</h2>
              </div>
              
              <p style="color: #999; font-size: 14px;">Код действителен 10 минут</p>
            </div>
          </body>
        </html>
        '''
        
        msg.attach(MIMEText(html_body, 'html'))
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Email sent successfully'
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }
