import Icon from '@/components/ui/icon';

const InstructionsTab = () => {
  return (
    <div className="prose prose-sm max-w-none">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Icon name="PlayCircle" size={20} />
        Быстрый старт
      </h3>
      
      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold">1. Выберите шаблон или создайте кастомный</h4>
          <p className="text-sm text-muted-foreground">
            Во вкладке «Шаблоны» — готовые автоматизации для Telegram, email, CRM, контента. Во вкладке «Instagram» — кастомный генератор контента.
          </p>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold">2. Заполните свои данные</h4>
          <p className="text-sm text-muted-foreground">
            API-ключи, ID таблиц, токены ботов — всё вшивается прямо в workflow JSON. Никаких плейсхолдеров после скачивания.
          </p>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold">3. Скачайте JSON</h4>
          <p className="text-sm text-muted-foreground">
            Нажмите «Скачать JSON» во вкладке Workflow. Файл готов к импорту.
          </p>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold">4. Импортируйте в n8n</h4>
          <p className="text-sm text-muted-foreground">
            В n8n: три точки (⋮) → <strong>Import from File</strong> → загрузите JSON файл. Для Google Sheets и Telegram нужно настроить Credentials в n8n.
          </p>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold">5. Активируйте</h4>
          <p className="text-sm text-muted-foreground">
            Переведите переключатель «Active» в правом верхнем углу n8n. Готово — автоматизация работает!
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold flex items-center gap-2 text-blue-900">
          <Icon name="HelpCircle" size={18} />
          Что такое n8n?
        </h4>
        <p className="text-sm text-blue-800 mt-1">
          n8n — бесплатная open-source платформа для автоматизаций (аналог Zapier/Make). 
          Можно поставить локально или использовать <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="underline">облачную версию</a>.
        </p>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-semibold flex items-center gap-2 text-amber-900">
          <Icon name="AlertTriangle" size={18} />
          Важно
        </h4>
        <ul className="text-sm text-amber-800 list-disc pl-4 mt-2 space-y-1">
          <li>API-ключи встраиваются в JSON — храните файл в безопасности</li>
          <li>Для Google Sheets нужно настроить OAuth2 в n8n (credentials)</li>
          <li>Для Telegram-ботов — создайте бота через @BotFather и получите токен</li>
          <li>n8n можно установить бесплатно через Docker: <code className="bg-muted px-1 rounded">docker run -it --name n8n -p 5678:5678 n8nio/n8n</code></li>
        </ul>
      </div>
    </div>
  );
};

export default InstructionsTab;
