#!/usr/bin/env python3
"""
Скрипт для создания Yandex Cloud Timer Trigger для автоматической отправки опросов
Требуется установленный и настроенный Yandex CLI (yc)
"""

import subprocess
import json
import sys

def run_command(cmd):
    """Выполняет команду и возвращает результат"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def check_yc_installed():
    """Проверяет установку Yandex CLI"""
    result = run_command('yc --version')
    if result is None:
        print("❌ Yandex CLI (yc) не установлен\n")
        print("Установите Yandex CLI:")
        print("  curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash")
        print("  source ~/.bashrc")
        print("  yc init")
        sys.exit(1)
    print("✓ Yandex CLI установлен")

def get_folder_id():
    """Получает folder ID"""
    folder_id = run_command('yc config get folder-id')
    if not folder_id:
        print("❌ Folder ID не настроен")
        print("Выполните: yc init")
        sys.exit(1)
    print(f"✓ Folder ID: {folder_id}")
    return folder_id

def get_service_account(folder_id):
    """Получает или создаёт сервисный аккаунт"""
    print("\nПолучаю список сервисных аккаунтов...")
    accounts_json = run_command('yc iam service-account list --format json')
    
    if not accounts_json or accounts_json == '[]':
        print("⚠️  Сервисных аккаунтов не найдено, создаю новый...")
        sa_name = "poll-scheduler-sa"
        
        run_command(f'yc iam service-account create --name {sa_name} --description "Service account for poll scheduler trigger"')
        
        sa_json = run_command(f'yc iam service-account get {sa_name} --format json')
        sa_data = json.loads(sa_json)
        sa_id = sa_data['id']
        
        # Даём права на вызов функций
        run_command(
            f'yc resource-manager folder add-access-binding {folder_id} '
            f'--role functions.functionInvoker '
            f'--subject serviceAccount:{sa_id}'
        )
        
        print(f"✓ Создан сервисный аккаунт: {sa_id}")
        return sa_id
    else:
        accounts = json.loads(accounts_json)
        sa_id = accounts[0]['id']
        print(f"✓ Используется сервисный аккаунт: {sa_id}")
        return sa_id

def check_existing_trigger():
    """Проверяет существующие триггеры"""
    print("\nПроверяю существующие триггеры...")
    triggers_json = run_command('yc serverless trigger list --format json')
    
    if triggers_json:
        triggers = json.loads(triggers_json)
        for trigger in triggers:
            if trigger.get('name') == 'poll-scheduler-timer':
                trigger_id = trigger['id']
                print(f"⚠️  Триггер 'poll-scheduler-timer' уже существует (ID: {trigger_id})")
                
                response = input("Пересоздать триггер? (y/n): ").lower()
                if response == 'y':
                    print("Удаляю старый триггер...")
                    run_command(f'yc serverless trigger delete {trigger_id}')
                    print("✓ Старый триггер удалён")
                    return False
                else:
                    print("✓ Используется существующий триггер")
                    return True
    return False

def create_trigger(sa_id):
    """Создаёт Timer Trigger"""
    print("\nСоздаю Timer Trigger...")
    
    # Используем webhook URL (не требует function ID)
    cmd = (
        f'yc serverless trigger create timer '
        f'--name poll-scheduler-timer '
        f'--description "Автоматическая отправка запланированных опросов каждую минуту" '
        f'--cron-expression "*/1 * * * ? *" '
        f'--invoke-function-service-account-id {sa_id} '
        f'--invoke-http '
        f'--http-method POST '
        f'--http-url "https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442"'
    )
    
    result = run_command(cmd)
    if result is None:
        print("❌ Ошибка создания триггера")
        sys.exit(1)
    
    print("\n=== ✓ Успешно! ===\n")
    print("Timer Trigger создан и активен")
    print("Опросы будут отправляться автоматически каждую минуту\n")
    print("Проверить триггеры:")
    print("  yc serverless trigger list\n")
    print("Посмотреть логи функции:")
    print("  yc serverless function logs poll-scheduler-worker\n")

def main():
    print("=== Настройка Timer Trigger для автоматической отправки опросов ===\n")
    
    check_yc_installed()
    folder_id = get_folder_id()
    sa_id = get_service_account(folder_id)
    
    if check_existing_trigger():
        print("\n=== Готово! ===")
        print("Опросы отправляются автоматически каждую минуту")
        return
    
    create_trigger(sa_id)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nОтменено пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        sys.exit(1)
