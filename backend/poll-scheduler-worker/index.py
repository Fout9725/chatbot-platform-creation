import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
from datetime import datetime

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def send_telegram_poll(chat_id: int, question: str, options: List[str]) -> bool:
    bot_token = os.environ.get('POLL_BOT_TOKEN')
    if not bot_token:
        print('ERROR: POLL_BOT_TOKEN not set')
        return False
    
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendPoll'
    
    data = {
        'chat_id': chat_id,
        'question': question,
        'options': options,
        'is_anonymous': False,
        'allows_multiple_answers': True
    }
    
    try:
        req = urllib.request.Request(
            telegram_url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f'Telegram API response: {result}')
            if not result.get('ok', False):
                print(f'Telegram API error: {result.get("description", "Unknown error")}')
            return result.get('ok', False)
    except Exception as e:
        print(f'Error sending poll: {e}')
        return False

def get_pending_polls() -> List[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Используем явное приведение типов для корректного сравнения
    cur.execute("""
        SELECT id, chat_id, poll_question, poll_options, scheduled_time
        FROM scheduled_polls
        WHERE status = 'pending' AND scheduled_time <= NOW()::timestamp
        ORDER BY scheduled_time ASC
        LIMIT 10
    """)
    
    polls = cur.fetchall()
    cur.close()
    conn.close()
    
    print(f"Found {len(polls)} pending polls to send")
    for poll in polls:
        print(f"  Poll {poll['id']}: chat_id={poll['chat_id']}, scheduled={poll.get('scheduled_time', 'N/A')}")
    
    return polls

def mark_poll_sent(poll_id: int, success: bool, error_message: str = None) -> None:
    conn = get_db_connection()
    cur = conn.cursor()
    
    if success:
        cur.execute("""
            UPDATE scheduled_polls
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (poll_id,))
    else:
        cur.execute("""
            UPDATE scheduled_polls
            SET status = 'failed', error_message = %s
            WHERE id = %s
        """, (error_message, poll_id))
    
    conn.commit()
    cur.close()
    conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Worker for sending scheduled polls automatically
    Args: event - HTTP request or timer trigger event
          context - cloud function context
    Returns: HTTP response with processing results
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    print(f'Worker invoked at {datetime.now()} by trigger or HTTP request')
    
    # Обрабатываем ожидающие опросы
    pending_polls = get_pending_polls()
    
    results = {
        'processed': 0,
        'sent': 0,
        'failed': 0,
        'errors': [],
        'timestamp': datetime.now().isoformat()
    }
    
    for poll in pending_polls:
        results['processed'] += 1
        
        print(f"Processing poll {poll['id']}: chat_id={poll['chat_id']}, question={poll['poll_question'][:50]}")
        
        try:
            success = send_telegram_poll(
                poll['chat_id'],
                poll['poll_question'],
                poll['poll_options']
            )
            
            if success:
                mark_poll_sent(poll['id'], True)
                results['sent'] += 1
                print(f"✓ Poll {poll['id']} sent successfully")
            else:
                mark_poll_sent(poll['id'], False, 'Telegram API returned error')
                results['failed'] += 1
                results['errors'].append(f"Poll {poll['id']}: Telegram API error")
                print(f"✗ Poll {poll['id']} failed: Telegram API error")
                
        except Exception as e:
            error_msg = str(e)
            mark_poll_sent(poll['id'], False, error_msg)
            results['failed'] += 1
            results['errors'].append(f"Poll {poll['id']}: {error_msg}")
            print(f"✗ Poll {poll['id']} failed: {error_msg}")
    
    print(f"Worker completed: {results['sent']} sent, {results['failed']} failed")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(results)
    }