import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function DocsFaqTab() {
  return (
    <TabsContent value="faq" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageCircleQuestion" size={24} className="text-purple-500" />
            Часто задаваемые вопросы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Как бот обучается?</h3>
              <p className="text-sm text-muted-foreground">
                Бот использует ML-модель на основе TF-IDF. Вы добавляете примеры вопросов-ответов, 
                и бот автоматически находит похожие вопросы пользователей. Также есть автообучение 
                на реальных диалогах за последние 7 дней.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Сколько примеров нужно для обучения?</h3>
              <p className="text-sm text-muted-foreground">
                Минимум 5-10 примеров для базовой работы. Оптимально 50-100 примеров 
                для хорошего качества. Бот постоянно обучается на новых диалогах.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Можно ли интегрировать с CRM?</h3>
              <p className="text-sm text-muted-foreground">
                Да! Поддерживается интеграция с AmoCRM и Bitrix24. 
                Перейдите на вкладку "AI Tools" → "CRM интеграция" и введите API ключи.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Как работает OCR?</h3>
              <p className="text-sm text-muted-foreground">
                Бот может распознавать текст с изображений (чеки, документы, визитки). 
                Поддерживаются форматы JPG, PNG, PDF. Бесплатный лимит 25,000 запросов/месяц.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Безопасны ли мои токены?</h3>
              <p className="text-sm text-muted-foreground">
                Да. Все токены шифруются в базе данных, передаются только по HTTPS, 
                никогда не попадают на frontend. Платформа проходит регулярный аудит безопасности.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Что делать если бот не отвечает?</h3>
              <p className="text-sm text-muted-foreground">
                1. Проверьте что бот активен (is_active = true)
                <br />2. Убедитесь что webhook настроен правильно
                <br />3. Добавьте больше обучающих примеров
                <br />4. Проверьте логи в разделе "Диалоги"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="LifeBuoy" size={24} className="text-blue-500" />
            Нужна помощь?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Если не нашли ответ на свой вопрос:
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://t.me/+QgiLIa1gFRY4Y2Iy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Icon name="MessageCircle" size={18} />
              Наше сообщество в Telegram
            </a>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
