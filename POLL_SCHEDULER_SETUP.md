# Настройка автоматической отправки опросов

## Проблема
Опросы должны отправляться автоматически в запланированное время без ручного управления.

## Решение
Используем встроенные **Yandex Cloud Timer Triggers** для автоматического вызова воркера каждую минуту.

## Быстрая настройка через Yandex CLI

### 1. Установите Yandex CLI (если ещё не установлен)
```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
source ~/.bashrc
yc init
```

### 2. Создайте Timer Trigger
```bash
yc serverless trigger create timer \
  --name poll-scheduler-timer \
  --cron-expression '*/1 * * * ? *' \
  --invoke-function-name poll-scheduler-worker \
  --invoke-function-service-account-id <YOUR_SERVICE_ACCOUNT_ID> \
  --description "Автоматическая отправка запланированных опросов каждую минуту"
```

**Где взять SERVICE_ACCOUNT_ID:**
```bash
yc iam service-account list
```

### 3. Проверьте что триггер создан
```bash
yc serverless trigger list
```

## Настройка через веб-консоль Yandex Cloud

1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Перейдите в **Cloud Functions → Триггеры**
3. Нажмите **Создать триггер**
4. Выберите тип: **Timer (Таймер)**
5. Укажите:
   - **Имя**: `poll-scheduler-timer`
   - **Cron-выражение**: `*/1 * * * ? *` (каждую минуту)
   - **Функция**: Выберите `poll-scheduler-worker`
   - **Сервисный аккаунт**: Выберите из списка
6. Нажмите **Создать**

## Проверка работы

После создания триггера опросы будут отправляться автоматически каждую минуту.

Проверить логи:
```bash
yc logging read --folder-id <YOUR_FOLDER_ID> --filter 'resource.type="serverless.function" AND resource.id="<FUNCTION_ID>"' --limit 50
```

Или через веб-консоль: **Cloud Functions → poll-scheduler-worker → Логи**

## Технические детали

- **Worker URL**: `https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442`
- **Cron выражение**: `*/1 * * * ? *` - каждую минуту
- **Логика**: Worker проверяет базу данных на наличие опросов со `status='pending'` и `scheduled_time <= NOW()`

## Альтернатива (если не хотите использовать CLI)

Используйте внешний cron-сервис (например, cron-job.org) для вызова триггера:
- **URL**: `https://functions.poehali.dev/3f3ec925-eb26-4cb8-b957-7c54490ccc71`
- **Метод**: POST
- **Частота**: Каждую минуту
- **Этот URL вызывает воркер автоматически**

---

После настройки триггера система будет работать полностью автоматически, без вашего участия.
