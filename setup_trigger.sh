#!/bin/bash

# Скрипт для создания Yandex Cloud Timer Trigger для автоматической отправки опросов
# Требуется установленный и настроенный Yandex CLI (yc)

set -e

echo "=== Настройка Timer Trigger для автоматической отправки опросов ==="
echo ""

# Проверка установки yc
if ! command -v yc &> /dev/null; then
    echo "❌ Yandex CLI (yc) не установлен"
    echo ""
    echo "Установите Yandex CLI:"
    echo "  curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    echo "  source ~/.bashrc"
    echo "  yc init"
    exit 1
fi

echo "✓ Yandex CLI установлен"
echo ""

# Получаем текущий folder ID
FOLDER_ID=$(yc config get folder-id 2>/dev/null || echo "")

if [ -z "$FOLDER_ID" ]; then
    echo "❌ Folder ID не настроен"
    echo "Выполните: yc init"
    exit 1
fi

echo "✓ Folder ID: $FOLDER_ID"
echo ""

# Получаем ID функции poll-scheduler-worker
echo "Ищу функцию poll-scheduler-worker..."
FUNCTION_ID=$(yc serverless function list --format json | jq -r '.[] | select(.name=="poll-scheduler-worker") | .id' 2>/dev/null || echo "")

if [ -z "$FUNCTION_ID" ]; then
    echo "❌ Функция poll-scheduler-worker не найдена"
    echo ""
    echo "Возможные причины:"
    echo "1. Функция создана в другом облаке/папке"
    echo "2. Функция имеет другое имя"
    echo ""
    echo "Список доступных функций:"
    yc serverless function list
    echo ""
    echo "Используйте URL функции напрямую: https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442"
    echo ""
    read -p "Создать триггер с прямым URL? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_WEBHOOK=true
else
    echo "✓ Функция найдена: $FUNCTION_ID"
    USE_WEBHOOK=false
fi
echo ""

# Получаем service account
echo "Получаю список сервисных аккаунтов..."
SERVICE_ACCOUNTS=$(yc iam service-account list --format json 2>/dev/null || echo "[]")
SERVICE_ACCOUNT_COUNT=$(echo "$SERVICE_ACCOUNTS" | jq '. | length')

if [ "$SERVICE_ACCOUNT_COUNT" -eq 0 ]; then
    echo "⚠️  Сервисных аккаунтов не найдено, создаю новый..."
    
    SA_NAME="poll-scheduler-sa"
    yc iam service-account create --name "$SA_NAME" --description "Service account for poll scheduler trigger"
    
    SERVICE_ACCOUNT_ID=$(yc iam service-account get "$SA_NAME" --format json | jq -r '.id')
    
    # Даём права на вызов функций
    yc resource-manager folder add-access-binding "$FOLDER_ID" \
        --role functions.functionInvoker \
        --subject serviceAccount:"$SERVICE_ACCOUNT_ID"
    
    echo "✓ Создан сервисный аккаунт: $SERVICE_ACCOUNT_ID"
else
    # Используем первый доступный
    SERVICE_ACCOUNT_ID=$(echo "$SERVICE_ACCOUNTS" | jq -r '.[0].id')
    echo "✓ Используется сервисный аккаунт: $SERVICE_ACCOUNT_ID"
fi
echo ""

# Проверяем существующие триггеры
echo "Проверяю существующие триггеры..."
EXISTING_TRIGGER=$(yc serverless trigger list --format json | jq -r '.[] | select(.name=="poll-scheduler-timer") | .id' 2>/dev/null || echo "")

if [ -n "$EXISTING_TRIGGER" ]; then
    echo "⚠️  Триггер 'poll-scheduler-timer' уже существует (ID: $EXISTING_TRIGGER)"
    read -p "Пересоздать триггер? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Удаляю старый триггер..."
        yc serverless trigger delete "$EXISTING_TRIGGER"
        echo "✓ Старый триггер удалён"
    else
        echo "✓ Используется существующий триггер"
        echo ""
        echo "=== Готово! ==="
        echo "Опросы отправляются автоматически каждую минуту"
        exit 0
    fi
fi
echo ""

# Создаём триггер
echo "Создаю Timer Trigger..."

if [ "$USE_WEBHOOK" = true ]; then
    # Создаём триггер с webhook
    yc serverless trigger create timer \
        --name poll-scheduler-timer \
        --description "Автоматическая отправка запланированных опросов каждую минуту" \
        --cron-expression '*/1 * * * ? *' \
        --invoke-function-service-account-id "$SERVICE_ACCOUNT_ID" \
        --invoke-http \
        --http-method POST \
        --http-url "https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442"
else
    # Создаём триггер с function ID
    yc serverless trigger create timer \
        --name poll-scheduler-timer \
        --description "Автоматическая отправка запланированных опросов каждую минуту" \
        --cron-expression '*/1 * * * ? *' \
        --invoke-function-id "$FUNCTION_ID" \
        --invoke-function-service-account-id "$SERVICE_ACCOUNT_ID"
fi

echo ""
echo "=== ✓ Успешно! ==="
echo ""
echo "Timer Trigger создан и активен"
echo "Опросы будут отправляться автоматически каждую минуту"
echo ""
echo "Проверить триггеры:"
echo "  yc serverless trigger list"
echo ""
echo "Посмотреть логи функции:"
echo "  yc serverless function logs poll-scheduler-worker"
echo ""
