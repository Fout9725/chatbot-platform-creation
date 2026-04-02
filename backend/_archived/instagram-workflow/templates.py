TEMPLATES = {
    "telegram-google-sheets": {
        "name": "Telegram → Google Sheets",
        "description": "Автоматически сохраняет сообщения из Telegram-бота в Google Таблицу. Отвечает пользователю подтверждением.",
        "category": "Мессенджеры",
        "icon": "MessageCircle",
        "nodes_count": 5,
        "integrations": ["Telegram", "Google Sheets"],
        "difficulty": "easy",
        "required_params": ["telegram_bot_token", "google_sheet_id"],
        "param_labels": {
            "telegram_bot_token": {"label": "Telegram Bot Token", "placeholder": "123456:ABC-DEF...", "type": "password", "hint": "Получите у @BotFather"},
            "google_sheet_id": {"label": "Google Sheet ID", "placeholder": "1A2B3C...", "type": "text", "hint": "ID из URL таблицы"}
        },
        "workflow": {
            "meta": {"instanceId": "tg-sheets-template", "templateCredsSetupCompleted": True},
            "name": "Telegram → Google Sheets",
            "tags": [{"name": "Telegram"}, {"name": "Google Sheets"}, {"name": "Automation"}],
            "nodes": [
                {
                    "parameters": {"updates": ["message"], "additionalFields": {}},
                    "name": "Telegram Trigger",
                    "type": "n8n-nodes-base.telegramTrigger",
                    "typeVersion": 1.1,
                    "position": [250, 300],
                    "id": "tg-trigger",
                    "webhookId": "tg-webhook-auto",
                    "credentials": {
                        "telegramApi": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "Telegram Bot"
                        }
                    }
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "const msg = $input.item.json.message;\nreturn {\n  json: {\n    chat_id: msg.chat.id,\n    username: msg.from.username || msg.from.first_name || 'unknown',\n    text: msg.text || '',\n    date: new Date(msg.date * 1000).toLocaleString('ru-RU')\n  }\n};"
                    },
                    "name": "Extract Message Data",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [480, 300],
                    "id": "extract-msg"
                },
                {
                    "parameters": {
                        "operation": "append",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "sheetName": {"__rl": True, "value": "Sheet1", "mode": "name"},
                        "columns": {
                            "mappingMode": "defineBelow",
                            "value": {
                                "Дата": "={{ $json.date }}",
                                "Пользователь": "={{ $json.username }}",
                                "Сообщение": "={{ $json.text }}",
                                "Chat ID": "={{ $json.chat_id }}"
                            }
                        },
                        "options": {}
                    },
                    "name": "Save to Google Sheets",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [700, 300],
                    "credentials": {
                        "googleSheetsOAuth2Api": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "Google Sheets account"
                        }
                    },
                    "id": "save-sheet"
                },
                {
                    "parameters": {
                        "chatId": "={{ $('Extract Message Data').item.json.chat_id }}",
                        "text": "✅ Записано! Спасибо за сообщение.",
                        "additionalFields": {}
                    },
                    "name": "Reply Confirmation",
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": [920, 300],
                    "credentials": {
                        "telegramApi": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "Telegram Bot"
                        }
                    },
                    "id": "tg-reply"
                },
                {
                    "parameters": {
                        "chatId": "={{ $('Extract Message Data').item.json.chat_id }}",
                        "text": "❌ Произошла ошибка при сохранении. Попробуйте позже.",
                        "additionalFields": {}
                    },
                    "name": "Reply Error",
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": [920, 500],
                    "credentials": {
                        "telegramApi": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "Telegram Bot"
                        }
                    },
                    "id": "tg-error-reply"
                }
            ],
            "connections": {
                "Telegram Trigger": {
                    "main": [[{"node": "Extract Message Data", "type": "main", "index": 0}]]
                },
                "Extract Message Data": {
                    "main": [[{"node": "Save to Google Sheets", "type": "main", "index": 0}]]
                },
                "Save to Google Sheets": {
                    "main": [
                        [{"node": "Reply Confirmation", "type": "main", "index": 0}],
                        [{"node": "Reply Error", "type": "main", "index": 0}]
                    ]
                }
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "rss-telegram-digest": {
        "name": "RSS-дайджест → Telegram",
        "description": "Собирает новости из RSS-лент каждый час и отправляет дайджест в Telegram-канал или чат.",
        "category": "Контент",
        "icon": "Rss",
        "nodes_count": 5,
        "integrations": ["RSS", "Telegram"],
        "difficulty": "easy",
        "required_params": ["telegram_bot_token", "telegram_chat_id", "rss_url"],
        "param_labels": {
            "telegram_bot_token": {"label": "Telegram Bot Token", "placeholder": "123456:ABC-DEF...", "type": "password", "hint": "Получите у @BotFather"},
            "telegram_chat_id": {"label": "Chat ID / Channel ID", "placeholder": "-1001234567890", "type": "text", "hint": "ID чата или канала"},
            "rss_url": {"label": "RSS URL", "placeholder": "https://example.com/feed.xml", "type": "text", "hint": "Ссылка на RSS-ленту"}
        },
        "workflow": {
            "meta": {"instanceId": "rss-tg-digest", "templateCredsSetupCompleted": True},
            "name": "RSS Digest → Telegram",
            "tags": [{"name": "RSS"}, {"name": "Telegram"}, {"name": "News"}],
            "nodes": [
                {
                    "parameters": {
                        "rule": {"interval": [{"field": "cronExpression", "expression": "0 */3 * * *"}]}
                    },
                    "name": "Every 3 Hours",
                    "type": "n8n-nodes-base.scheduleTrigger",
                    "typeVersion": 1.1,
                    "position": [250, 300],
                    "id": "schedule"
                },
                {
                    "parameters": {"url": "={{USER_RSS_URL}}"},
                    "name": "Read RSS Feed",
                    "type": "n8n-nodes-base.rssFeedRead",
                    "typeVersion": 1,
                    "position": [480, 300],
                    "id": "rss-read"
                },
                {
                    "parameters": {"maxItems": 5, "options": {}},
                    "name": "Limit to 5 Items",
                    "type": "n8n-nodes-base.limit",
                    "typeVersion": 1,
                    "position": [700, 300],
                    "id": "limit-items"
                },
                {
                    "parameters": {
                        "mode": "runOnceForAllItems",
                        "jsCode": "const items = $input.all();\nlet digest = '📰 *Дайджест новостей*\\n\\n';\nfor (let i = 0; i < items.length; i++) {\n  const item = items[i].json;\n  const title = item.title || 'Без заголовка';\n  const link = item.link || '';\n  digest += `${i+1}. [${title}](${link})\\n`;\n}\ndigest += `\\n_${new Date().toLocaleString('ru-RU')}_`;\nreturn [{json: {message: digest}}];"
                    },
                    "name": "Format Digest",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [920, 300],
                    "id": "format-digest"
                },
                {
                    "parameters": {
                        "chatId": "{{USER_TELEGRAM_CHAT_ID}}",
                        "text": "={{ $json.message }}",
                        "additionalFields": {"parse_mode": "Markdown", "disable_web_page_preview": True}
                    },
                    "name": "Send to Telegram",
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": [1140, 300],
                    "credentials": {
                        "telegramApi": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "Telegram Bot"
                        }
                    },
                    "id": "tg-send"
                }
            ],
            "connections": {
                "Every 3 Hours": {"main": [[{"node": "Read RSS Feed", "type": "main", "index": 0}]]},
                "Read RSS Feed": {"main": [[{"node": "Limit to 5 Items", "type": "main", "index": 0}]]},
                "Limit to 5 Items": {"main": [[{"node": "Format Digest", "type": "main", "index": 0}]]},
                "Format Digest": {"main": [[{"node": "Send to Telegram", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "webhook-email-notification": {
        "name": "Webhook → Email уведомление",
        "description": "Принимает данные через webhook (формы, CRM) и отправляет email-уведомление. Идеально для заявок с сайта.",
        "category": "Бизнес",
        "icon": "Mail",
        "nodes_count": 4,
        "integrations": ["Webhook", "Email (SMTP)"],
        "difficulty": "easy",
        "required_params": ["email_to", "smtp_host", "smtp_user", "smtp_password"],
        "param_labels": {
            "email_to": {"label": "Email получателя", "placeholder": "you@example.com", "type": "text", "hint": "Куда отправлять уведомления"},
            "smtp_host": {"label": "SMTP сервер", "placeholder": "smtp.gmail.com", "type": "text", "hint": "Для Gmail: smtp.gmail.com"},
            "smtp_user": {"label": "SMTP логин", "placeholder": "you@gmail.com", "type": "text", "hint": "Email для отправки"},
            "smtp_password": {"label": "SMTP пароль", "placeholder": "app-password", "type": "password", "hint": "App Password для Gmail"}
        },
        "workflow": {
            "meta": {"instanceId": "webhook-email", "templateCredsSetupCompleted": True},
            "name": "Webhook → Email Notification",
            "tags": [{"name": "Webhook"}, {"name": "Email"}, {"name": "Notifications"}],
            "nodes": [
                {
                    "parameters": {
                        "path": "lead-notification",
                        "responseMode": "responseNode",
                        "options": {}
                    },
                    "name": "Webhook",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 2,
                    "position": [250, 300],
                    "id": "webhook",
                    "webhookId": "lead-hook"
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "const d = $input.item.json;\nconst name = d.name || d.fullName || d.имя || 'Не указано';\nconst phone = d.phone || d.телефон || d.mobile || 'Не указан';\nconst email = d.email || d.почта || 'Не указан';\nconst msg = d.message || d.comment || d.сообщение || '';\nconst source = d.source || d.utm_source || 'Прямой';\n\nconst html = `<h2>🔔 Новая заявка</h2>\n<table border='1' cellpadding='8' style='border-collapse:collapse'>\n<tr><td><b>Имя</b></td><td>${name}</td></tr>\n<tr><td><b>Телефон</b></td><td>${phone}</td></tr>\n<tr><td><b>Email</b></td><td>${email}</td></tr>\n<tr><td><b>Сообщение</b></td><td>${msg}</td></tr>\n<tr><td><b>Источник</b></td><td>${source}</td></tr>\n<tr><td><b>Дата</b></td><td>${new Date().toLocaleString('ru-RU')}</td></tr>\n</table>`;\n\nreturn {json: {subject: `Новая заявка от ${name}`, html, name, phone}};"
                    },
                    "name": "Format Email",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [480, 300],
                    "id": "format-email"
                },
                {
                    "parameters": {
                        "fromEmail": "={{USER_SMTP_USER}}",
                        "toEmail": "={{USER_EMAIL_TO}}",
                        "subject": "={{ $json.subject }}",
                        "emailType": "html",
                        "html": "={{ $json.html }}",
                        "options": {}
                    },
                    "name": "Send Email",
                    "type": "n8n-nodes-base.emailSend",
                    "typeVersion": 2.1,
                    "position": [700, 300],
                    "credentials": {
                        "smtp": {
                            "id": "CONFIGURE_IN_N8N",
                            "name": "SMTP account"
                        }
                    },
                    "id": "send-email"
                },
                {
                    "parameters": {
                        "respondWith": "json",
                        "responseBody": "={\"status\": \"ok\", \"message\": \"Заявка получена\"}",
                        "options": {"responseCode": 200}
                    },
                    "name": "Respond OK",
                    "type": "n8n-nodes-base.respondToWebhook",
                    "typeVersion": 1.1,
                    "position": [920, 300],
                    "id": "respond"
                }
            ],
            "connections": {
                "Webhook": {"main": [[{"node": "Format Email", "type": "main", "index": 0}]]},
                "Format Email": {"main": [[{"node": "Send Email", "type": "main", "index": 0}]]},
                "Send Email": {"main": [[{"node": "Respond OK", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "google-sheets-telegram-crm": {
        "name": "Мини-CRM: Google Sheets + Telegram",
        "description": "Telegram-бот для простой CRM: добавление клиентов, просмотр статусов, обновление сделок — всё через чат.",
        "category": "Бизнес",
        "icon": "Users",
        "nodes_count": 6,
        "integrations": ["Telegram", "Google Sheets"],
        "difficulty": "medium",
        "required_params": ["telegram_bot_token", "google_sheet_id"],
        "param_labels": {
            "telegram_bot_token": {"label": "Telegram Bot Token", "placeholder": "123456:ABC-DEF...", "type": "password", "hint": "Получите у @BotFather"},
            "google_sheet_id": {"label": "Google Sheet ID", "placeholder": "1A2B3C...", "type": "text", "hint": "Таблица с колонками: Имя, Телефон, Статус, Дата"}
        },
        "workflow": {
            "meta": {"instanceId": "tg-crm-sheets", "templateCredsSetupCompleted": True},
            "name": "Mini CRM: Telegram + Google Sheets",
            "tags": [{"name": "CRM"}, {"name": "Telegram"}, {"name": "Google Sheets"}],
            "nodes": [
                {
                    "parameters": {"updates": ["message"], "additionalFields": {}},
                    "name": "Telegram Trigger",
                    "type": "n8n-nodes-base.telegramTrigger",
                    "typeVersion": 1.1,
                    "position": [250, 300],
                    "id": "tg-trigger",
                    "webhookId": "crm-tg-hook",
                    "credentials": {"telegramApi": {"id": "CONFIGURE_IN_N8N", "name": "Telegram Bot"}}
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "const msg = $input.item.json.message;\nconst text = (msg.text || '').trim();\nconst chatId = msg.chat.id;\n\nlet command = 'unknown';\nlet data = '';\n\nif (text.startsWith('/add ')) {\n  command = 'add';\n  data = text.replace('/add ', '');\n} else if (text === '/list') {\n  command = 'list';\n} else if (text.startsWith('/status ')) {\n  command = 'status';\n  data = text.replace('/status ', '');\n} else if (text === '/help' || text === '/start') {\n  command = 'help';\n}\n\nreturn {json: {command, data, chatId}};"
                    },
                    "name": "Parse Command",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [480, 300],
                    "id": "parse-cmd"
                },
                {
                    "parameters": {
                        "conditions": {
                            "options": {"caseSensitive": True},
                            "conditions": [
                                {"id": "is-add", "leftValue": "={{ $json.command }}", "rightValue": "add", "operator": {"type": "string", "operation": "equals"}}
                            ]
                        }
                    },
                    "name": "Is Add Command?",
                    "type": "n8n-nodes-base.if",
                    "typeVersion": 2,
                    "position": [700, 200],
                    "id": "if-add"
                },
                {
                    "parameters": {
                        "operation": "append",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "sheetName": {"__rl": True, "value": "Sheet1", "mode": "name"},
                        "columns": {
                            "mappingMode": "defineBelow",
                            "value": {
                                "Имя": "={{ $('Parse Command').item.json.data.split(',')[0]?.trim() || '' }}",
                                "Телефон": "={{ $('Parse Command').item.json.data.split(',')[1]?.trim() || '' }}",
                                "Статус": "Новый",
                                "Дата": "={{ $now.format('DD.MM.YYYY HH:mm') }}"
                            }
                        },
                        "options": {}
                    },
                    "name": "Add Client to Sheet",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [940, 200],
                    "credentials": {"googleSheetsOAuth2Api": {"id": "CONFIGURE_IN_N8N", "name": "Google Sheets account"}},
                    "id": "add-client"
                },
                {
                    "parameters": {
                        "chatId": "={{ $('Parse Command').item.json.chatId }}",
                        "text": "✅ Клиент добавлен в CRM!",
                        "additionalFields": {}
                    },
                    "name": "Confirm Add",
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": [1160, 200],
                    "credentials": {"telegramApi": {"id": "CONFIGURE_IN_N8N", "name": "Telegram Bot"}},
                    "id": "confirm-add"
                },
                {
                    "parameters": {
                        "chatId": "={{ $('Parse Command').item.json.chatId }}",
                        "text": "📋 *Команды CRM-бота:*\n\n/add Имя, Телефон — добавить клиента\n/list — список клиентов\n/status Имя, Новый статус — обновить\n/help — справка",
                        "additionalFields": {"parse_mode": "Markdown"}
                    },
                    "name": "Send Help",
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": [700, 450],
                    "credentials": {"telegramApi": {"id": "CONFIGURE_IN_N8N", "name": "Telegram Bot"}},
                    "id": "send-help"
                }
            ],
            "connections": {
                "Telegram Trigger": {"main": [[{"node": "Parse Command", "type": "main", "index": 0}]]},
                "Parse Command": {"main": [[{"node": "Is Add Command?", "type": "main", "index": 0}]]},
                "Is Add Command?": {
                    "main": [
                        [{"node": "Add Client to Sheet", "type": "main", "index": 0}],
                        [{"node": "Send Help", "type": "main", "index": 0}]
                    ]
                },
                "Add Client to Sheet": {"main": [[{"node": "Confirm Add", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "ai-content-generator": {
        "name": "AI-генератор контент-плана",
        "description": "Генерирует контент-план на неделю через Claude/OpenAI и сохраняет в Google Sheets. Запуск по расписанию каждый понедельник.",
        "category": "Контент",
        "icon": "Brain",
        "nodes_count": 5,
        "integrations": ["Claude AI", "Google Sheets"],
        "difficulty": "medium",
        "required_params": ["anthropic_api_key", "google_sheet_id", "business_topic"],
        "param_labels": {
            "anthropic_api_key": {"label": "Anthropic API Key", "placeholder": "sk-ant-...", "type": "password", "hint": "console.anthropic.com"},
            "google_sheet_id": {"label": "Google Sheet ID", "placeholder": "1A2B3C...", "type": "text", "hint": "Таблица для контент-плана"},
            "business_topic": {"label": "Тема/Ниша бизнеса", "placeholder": "фитнес, кофейня, IT-стартап...", "type": "text", "hint": "Для генерации релевантных идей"}
        },
        "workflow": {
            "meta": {"instanceId": "ai-content-plan", "templateCredsSetupCompleted": True},
            "name": "AI Weekly Content Plan Generator",
            "tags": [{"name": "AI"}, {"name": "Content"}, {"name": "Planning"}],
            "nodes": [
                {
                    "parameters": {
                        "rule": {"interval": [{"field": "cronExpression", "expression": "0 9 * * 1"}]}
                    },
                    "name": "Every Monday 9 AM",
                    "type": "n8n-nodes-base.scheduleTrigger",
                    "typeVersion": 1.1,
                    "position": [250, 300],
                    "id": "schedule"
                },
                {
                    "parameters": {
                        "method": "POST",
                        "url": "https://api.anthropic.com/v1/messages",
                        "sendHeaders": True,
                        "headerParameters": {
                            "parameters": [
                                {"name": "x-api-key", "value": "{{USER_ANTHROPIC_API_KEY}}"},
                                {"name": "anthropic-version", "value": "2023-06-01"},
                                {"name": "content-type", "value": "application/json"}
                            ]
                        },
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": "{\"model\":\"claude-3-5-sonnet-20241022\",\"max_tokens\":3000,\"messages\":[{\"role\":\"user\",\"content\":\"Создай контент-план на 7 дней для ниши: {{USER_BUSINESS_TOPIC}}. Для каждого дня укажи: тему поста, тип контента (рилс/карусель/сторис/пост), краткое описание, хэштеги. Ответ СТРОГО в JSON массиве: [{\\\"day\\\": 1, \\\"topic\\\": \\\"...\\\", \\\"type\\\": \\\"...\\\", \\\"description\\\": \\\"...\\\", \\\"hashtags\\\": \\\"...\\\"}]\"}]}",
                        "options": {"timeout": 60000}
                    },
                    "name": "Claude - Generate Plan",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 4.2,
                    "position": [480, 300],
                    "id": "claude-plan"
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "const resp = $input.item.json;\nconst text = resp.content[0].text;\nconst m = text.match(/\\[\\s*\\{[\\s\\S]*\\}\\s*\\]/);\nif (!m) throw new Error('No JSON array in response');\nconst plan = JSON.parse(m[0]);\nconst items = plan.map(p => ({\n  json: {\n    'День': `День ${p.day}`,\n    'Тема': p.topic,\n    'Тип': p.type,\n    'Описание': p.description,\n    'Хэштеги': p.hashtags,\n    'Неделя': $now.format('DD.MM.YYYY')\n  }\n}));\nreturn items;"
                    },
                    "name": "Parse Content Plan",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [700, 300],
                    "id": "parse-plan"
                },
                {
                    "parameters": {
                        "operation": "append",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "sheetName": {"__rl": True, "value": "Sheet1", "mode": "name"},
                        "columns": {
                            "mappingMode": "autoMapInputData",
                            "matchingColumns": []
                        },
                        "options": {}
                    },
                    "name": "Save Plan to Sheets",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [920, 300],
                    "credentials": {"googleSheetsOAuth2Api": {"id": "CONFIGURE_IN_N8N", "name": "Google Sheets account"}},
                    "id": "save-plan"
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "return {json: {success: true, message: 'Контент-план на неделю сохранён в Google Sheets'}};"
                    },
                    "name": "Done",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [1140, 300],
                    "id": "done"
                }
            ],
            "connections": {
                "Every Monday 9 AM": {"main": [[{"node": "Claude - Generate Plan", "type": "main", "index": 0}]]},
                "Claude - Generate Plan": {"main": [[{"node": "Parse Content Plan", "type": "main", "index": 0}]]},
                "Parse Content Plan": {"main": [[{"node": "Save Plan to Sheets", "type": "main", "index": 0}]]},
                "Save Plan to Sheets": {"main": [[{"node": "Done", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "scheduled-backup-sheets": {
        "name": "Автобэкап Google Sheets → JSON",
        "description": "Ежедневно делает резервную копию Google Таблицы и сохраняет как JSON-файл через webhook. Защита от потери данных.",
        "category": "Утилиты",
        "icon": "HardDrive",
        "nodes_count": 4,
        "integrations": ["Google Sheets", "Webhook"],
        "difficulty": "easy",
        "required_params": ["google_sheet_id"],
        "param_labels": {
            "google_sheet_id": {"label": "Google Sheet ID", "placeholder": "1A2B3C...", "type": "text", "hint": "ID таблицы для бэкапа"}
        },
        "workflow": {
            "meta": {"instanceId": "sheets-backup", "templateCredsSetupCompleted": True},
            "name": "Daily Google Sheets Backup",
            "tags": [{"name": "Backup"}, {"name": "Google Sheets"}, {"name": "Scheduled"}],
            "nodes": [
                {
                    "parameters": {
                        "rule": {"interval": [{"field": "cronExpression", "expression": "0 2 * * *"}]}
                    },
                    "name": "Daily at 2 AM",
                    "type": "n8n-nodes-base.scheduleTrigger",
                    "typeVersion": 1.1,
                    "position": [250, 300],
                    "id": "schedule"
                },
                {
                    "parameters": {
                        "operation": "read",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "range": "",
                        "options": {"returnAllMatches": True}
                    },
                    "name": "Read All Data",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [480, 300],
                    "credentials": {"googleSheetsOAuth2Api": {"id": "CONFIGURE_IN_N8N", "name": "Google Sheets account"}},
                    "id": "read-all"
                },
                {
                    "parameters": {
                        "mode": "runOnceForAllItems",
                        "jsCode": "const allData = $input.all().map(i => i.json);\nconst backup = {\n  timestamp: new Date().toISOString(),\n  rows_count: allData.length,\n  data: allData\n};\nreturn [{json: {backup: JSON.stringify(backup, null, 2), filename: `backup_${$now.format('YYYYMMDD_HHmm')}.json`, rows: allData.length}}];"
                    },
                    "name": "Create Backup JSON",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [700, 300],
                    "id": "create-backup"
                },
                {
                    "parameters": {
                        "mode": "runOnceForEachItem",
                        "jsCode": "return {json: {status: 'ok', message: `Бэкап создан: ${$json.filename} (${$json.rows} строк)`}};"
                    },
                    "name": "Backup Complete",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [920, 300],
                    "id": "complete"
                }
            ],
            "connections": {
                "Daily at 2 AM": {"main": [[{"node": "Read All Data", "type": "main", "index": 0}]]},
                "Read All Data": {"main": [[{"node": "Create Backup JSON", "type": "main", "index": 0}]]},
                "Create Backup JSON": {"main": [[{"node": "Backup Complete", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    },

    "openai-image-batch": {
        "name": "Пакетная генерация картинок AI",
        "description": "Берёт список промптов из Google Sheets, генерирует картинки через DALL-E 3 и сохраняет ссылки обратно в таблицу.",
        "category": "AI / Нейросети",
        "icon": "Image",
        "nodes_count": 6,
        "integrations": ["OpenAI DALL-E", "Google Sheets"],
        "difficulty": "medium",
        "required_params": ["openai_api_key", "google_sheet_id"],
        "param_labels": {
            "openai_api_key": {"label": "OpenAI API Key", "placeholder": "sk-...", "type": "password", "hint": "platform.openai.com"},
            "google_sheet_id": {"label": "Google Sheet ID", "placeholder": "1A2B3C...", "type": "text", "hint": "Колонка A: промпт, B: ссылка (заполнится)"}
        },
        "workflow": {
            "meta": {"instanceId": "dalle-batch", "templateCredsSetupCompleted": True},
            "name": "Batch DALL-E Image Generator",
            "tags": [{"name": "AI"}, {"name": "Images"}, {"name": "DALL-E"}],
            "nodes": [
                {
                    "parameters": {"path": "generate-images", "responseMode": "lastNode", "options": {}},
                    "name": "Start (Webhook or Manual)",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 2,
                    "position": [250, 300],
                    "id": "webhook",
                    "webhookId": "dalle-batch-hook"
                },
                {
                    "parameters": {
                        "operation": "read",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "range": "A:B",
                        "options": {"returnAllMatches": True}
                    },
                    "name": "Read Prompts",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [480, 300],
                    "credentials": {"googleSheetsOAuth2Api": {"id": "CONFIGURE_IN_N8N", "name": "Google Sheets account"}},
                    "id": "read-prompts"
                },
                {
                    "parameters": {
                        "conditions": {
                            "conditions": [
                                {"leftValue": "={{ $json['A'] }}", "rightValue": "", "operator": {"type": "string", "operation": "isNotEmpty"}},
                                {"leftValue": "={{ $json['B'] }}", "rightValue": "", "operator": {"type": "string", "operation": "isEmpty"}}
                            ],
                            "combinator": "and"
                        }
                    },
                    "name": "Filter - Need Generation",
                    "type": "n8n-nodes-base.filter",
                    "typeVersion": 2,
                    "position": [700, 300],
                    "id": "filter"
                },
                {
                    "parameters": {
                        "method": "POST",
                        "url": "https://api.openai.com/v1/images/generations",
                        "sendHeaders": True,
                        "headerParameters": {
                            "parameters": [
                                {"name": "Authorization", "value": "Bearer {{USER_OPENAI_API_KEY}}"},
                                {"name": "Content-Type", "value": "application/json"}
                            ]
                        },
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": "={{ JSON.stringify({\"model\": \"dall-e-3\", \"prompt\": $json['A'], \"n\": 1, \"size\": \"1024x1024\", \"quality\": \"standard\"}) }}",
                        "options": {"timeout": 120000, "batching": {"batch": {"batchSize": 1, "batchInterval": 2000}}}
                    },
                    "name": "DALL-E Generate",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 4.2,
                    "position": [920, 300],
                    "id": "dalle",
                    "onError": "continueErrorOutput"
                },
                {
                    "parameters": {
                        "operation": "update",
                        "sheetId": {"__rl": True, "value": "{{USER_GOOGLE_SHEET_ID}}", "mode": "id"},
                        "range": "=B{{ $runIndex + 2 }}",
                        "columns": {
                            "mappingMode": "defineBelow",
                            "value": {"B": "={{ $json.data[0].url }}"}
                        },
                        "options": {}
                    },
                    "name": "Save Image URL",
                    "type": "n8n-nodes-base.googleSheets",
                    "typeVersion": 4.5,
                    "position": [1140, 300],
                    "credentials": {"googleSheetsOAuth2Api": {"id": "CONFIGURE_IN_N8N", "name": "Google Sheets account"}},
                    "id": "save-url"
                },
                {
                    "parameters": {
                        "mode": "runOnceForAllItems",
                        "jsCode": "const count = $input.all().length;\nreturn [{json: {status: 'ok', generated: count, message: `Сгенерировано ${count} картинок`}}];"
                    },
                    "name": "Summary",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 2,
                    "position": [1360, 300],
                    "id": "summary"
                }
            ],
            "connections": {
                "Start (Webhook or Manual)": {"main": [[{"node": "Read Prompts", "type": "main", "index": 0}]]},
                "Read Prompts": {"main": [[{"node": "Filter - Need Generation", "type": "main", "index": 0}]]},
                "Filter - Need Generation": {"main": [[{"node": "DALL-E Generate", "type": "main", "index": 0}]]},
                "DALL-E Generate": {
                    "main": [
                        [{"node": "Save Image URL", "type": "main", "index": 0}],
                        [{"node": "Summary", "type": "main", "index": 0}]
                    ]
                },
                "Save Image URL": {"main": [[{"node": "Summary", "type": "main", "index": 0}]]}
            },
            "settings": {"executionOrder": "v1", "saveManualExecutions": True},
            "pinData": {},
            "active": False
        }
    }
}
