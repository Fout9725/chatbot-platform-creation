import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const n8nTemplates = [
  {
    id: 'crm-integration',
    name: 'CRM Интеграция',
    description: 'Автоматическая синхронизация контактов с популярными CRM системами',
    category: 'business',
    icon: 'Database',
    nodes: 12,
    difficulty: 'medium',
    preview: 'Webhook → Обработка → CRM API → Уведомление',
    planRequired: 'optimal'
  },
  {
    id: 'email-automation',
    name: 'Email автоответчик',
    description: 'Умные ответы на email с использованием AI',
    category: 'communication',
    icon: 'Mail',
    nodes: 8,
    difficulty: 'easy',
    preview: 'Email Trigger → AI Processing → Send Response',
    planRequired: 'optimal'
  },
  {
    id: 'data-analytics',
    name: 'Аналитика данных',
    description: 'Сбор и анализ данных из различных источников',
    category: 'analytics',
    icon: 'TrendingUp',
    nodes: 15,
    difficulty: 'hard',
    preview: 'Multiple Sources → Aggregation → Analysis → Report',
    planRequired: 'premium'
  },
  {
    id: 'social-media',
    name: 'Соц. сети автопостинг',
    description: 'Автоматическая публикация контента в соц. сетях',
    category: 'marketing',
    icon: 'Share2',
    nodes: 10,
    difficulty: 'medium',
    preview: 'Schedule → Content Gen → Multi-platform Post',
    planRequired: 'optimal'
  },
  {
    id: 'payment-processor',
    name: 'Обработка платежей',
    description: 'Прием и обработка платежей с уведомлениями',
    category: 'finance',
    icon: 'CreditCard',
    nodes: 14,
    difficulty: 'hard',
    preview: 'Payment → Validation → Database → Notification',
    planRequired: 'premium'
  },
  {
    id: 'support-bot',
    name: 'Бот поддержки',
    description: 'AI-бот для ответов на вопросы клиентов',
    category: 'support',
    icon: 'MessageCircle',
    nodes: 9,
    difficulty: 'easy',
    preview: 'Message → AI → Knowledge Base → Response',
    planRequired: 'free'
  },
  {
    id: 'lead-generation',
    name: 'Генерация лидов',
    description: 'Сбор и квалификация потенциальных клиентов',
    category: 'sales',
    icon: 'Users',
    nodes: 11,
    difficulty: 'medium',
    preview: 'Form → Scoring → CRM → Follow-up',
    planRequired: 'optimal'
  },
  {
    id: 'inventory-sync',
    name: 'Синхронизация склада',
    description: 'Автоматическое обновление остатков товаров',
    category: 'business',
    icon: 'Package',
    nodes: 13,
    difficulty: 'medium',
    preview: 'Stock Check → Update → Notify → Report',
    planRequired: 'optimal'
  }
];

const BotBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('visual');
  const [textPrompt, setTextPrompt] = useState('');
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const userPlan = user?.plan || 'free';

  useEffect(() => {
    if (!isAuthenticated || !user?.plan || user?.plan === 'free') {
      navigate('/pricing');
    }
  }, [isAuthenticated, user, navigate]);

  const planLimits = {
    free: { templates: 3, textGeneration: 0, advancedBlocks: false },
    optimal: { templates: 20, textGeneration: 5, advancedBlocks: true },
    premium: { templates: -1, textGeneration: -1, advancedBlocks: true },
    partner: { templates: -1, textGeneration: -1, advancedBlocks: true }
  };

  const currentLimits = planLimits[userPlan as keyof typeof planLimits];

  const handleGenerateFromText = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Опишите, какого бота вы хотите создать',
        variant: 'destructive'
      });
      return;
    }

    if (currentLimits.textGeneration === 0) {
      toast({
        title: 'Недоступно в вашем тарифе',
        description: 'Создание ботов по текстовому запросу доступно с тарифа Оптимальный',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: 'Бот создан! 🎉',
        description: 'Ваш ИИ-агент готов к работе'
      });
      navigate('/dashboard');
    }, 3000);
  };

  const handleUseTemplate = (templateId: string) => {
    const template = n8nTemplates.find(t => t.id === templateId);
    if (!template) return;

    const planOrder = ['free', 'optimal', 'premium', 'partner'];
    const userPlanIndex = planOrder.indexOf(userPlan);
    const requiredPlanIndex = planOrder.indexOf(template.planRequired);

    if (userPlanIndex < requiredPlanIndex) {
      toast({
        title: 'Недоступно в вашем тарифе',
        description: `Этот шаблон требует тариф ${template.planRequired === 'optimal' ? 'Оптимальный' : 'Премиум'} или выше`,
        variant: 'destructive'
      });
      return;
    }

    if (currentLimits.templates !== -1) {
      const usedTemplates = 0;
      if (usedTemplates >= currentLimits.templates) {
        toast({
          title: 'Лимит шаблонов исчерпан',
          description: 'Обновите тариф для доступа к большему количеству шаблонов',
          variant: 'destructive'
        });
        return;
      }
    }

    setSelectedTemplate(templateId);
    toast({
      title: 'Шаблон применен! 🎉',
      description: `Загружен шаблон "${template.name}"`
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return difficulty;
    }
  };

  return (
    <PageLayout
      title="Конструктор ботов"
      description="Создание AI-бота без программирования"
      keywords="конструктор ботов, AI-бот, создание бота, ИнтеллектПро"
    >
      <div className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="cube" size={220} />
        </div>
        <div className="mb-8 relative z-10">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="Home" size={18} className="mr-2" />
              Главная
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад к панели
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-glass-title">
                Конструктор ИИ-агентов
              </h1>
              <p className="text-glass-muted">
                Создайте бота блоками, из шаблона или просто опишите задачу
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2 border-white/20 text-gray-200 bg-white/5">
                Тариф: {userPlan === 'free' ? 'Бесплатный' : userPlan === 'optimal' ? 'Оптимальный' : userPlan === 'premium' ? 'Премиум' : 'Партнёрский'}
              </Badge>
              <div className="text-sm text-glass-muted">
                {currentLimits.templates === -1 ? 'Безлимит шаблонов' : `Шаблонов: ${currentLimits.templates}`}
                {currentLimits.textGeneration !== 0 && (
                  <span className="ml-2">
                    {currentLimits.textGeneration === -1 ? 'Безлимит AI' : `AI: ${currentLimits.textGeneration}/мес`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative z-10">
          <TabsList
            data-tour="builder-tabs"
            className="grid w-full grid-cols-3 glass-panel-subtle border border-white/10 bg-transparent"
          >
            <TabsTrigger
              value="visual"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Boxes" size={16} className="mr-2" />
              Визуальный конструктор
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Library" size={16} className="mr-2" />
              Шаблоны N8N
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Sparkles" size={16} className="mr-2" />
              Создать по тексту
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Визуальный конструктор</CardTitle>
                <CardDescription>
                  Собирайте бота из готовых блоков с помощью drag & drop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-200">Название бота</label>
                    <Input
                      type="text"
                      placeholder="Мой ИИ-помощник"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-200">Описание</label>
                    <Textarea
                      placeholder="Что будет делать ваш бот?"
                      value={botDescription}
                      onChange={(e) => setBotDescription(e.target.value)}
                      rows={3}
                      className="glass-input"
                    />
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Icon name="Boxes" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Рабочая область конструктора</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Здесь вы будете перетаскивать блоки и соединять их для создания логики бота
                    </p>
                    {!currentLimits.advancedBlocks && (
                      <Badge variant="outline" className="mb-4">
                        Базовые блоки: Приветствие, Ответ, Кнопки
                      </Badge>
                    )}
                    {currentLimits.advancedBlocks && (
                      <Badge variant="outline" className="mb-4">
                        Доступны все блоки включая AI, API, База данных
                      </Badge>
                    )}
                    <Button type="button">
                      <Icon name="Plus" size={18} className="mr-2" />
                      Добавить блок
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Шаблоны из библиотеки N8N</CardTitle>
                <CardDescription>
                  Готовые решения для быстрого старта. Выберите шаблон и адаптируйте под свои задачи
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {n8nTemplates.map((template) => {
                    const planOrder = ['free', 'optimal', 'premium', 'partner'];
                    const userPlanIndex = planOrder.indexOf(userPlan);
                    const requiredPlanIndex = planOrder.indexOf(template.planRequired);
                    const isLocked = userPlanIndex < requiredPlanIndex;

                    return (
                      <Card key={template.id} className={isLocked ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10`}>
                              <Icon name={template.icon as any} size={24} className="text-primary" />
                            </div>
                            {isLocked && <Icon name="Lock" size={16} className="text-muted-foreground" />}
                          </div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                              {getDifficultyText(template.difficulty)}
                            </Badge>
                            <span className="text-muted-foreground">{template.nodes} блоков</span>
                          </div>
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {template.preview}
                          </div>
                          <Button
                            type="button"
                            className="w-full"
                            variant={isLocked ? 'outline' : 'default'}
                            onClick={() => handleUseTemplate(template.id)}
                            disabled={isLocked}
                          >
                            {isLocked ? (
                              <>
                                <Icon name="Lock" size={16} className="mr-2" />
                                Требуется {template.planRequired === 'optimal' ? 'Оптимальный' : 'Премиум'}
                              </>
                            ) : (
                              <>
                                <Icon name="Download" size={16} className="mr-2" />
                                Использовать шаблон
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Sparkles" className="text-primary" />
                  Создание бота по текстовому запросу
                </CardTitle>
                <CardDescription>
                  Опишите, что должен делать ваш бот, и AI соберёт его автоматически
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLimits.textGeneration === 0 ? (
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Функция недоступна</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Создание ботов по текстовому запросу доступно начиная с тарифа Оптимальный
                    </p>
                    <Button type="button" onClick={() => navigate('/plan-selection')}>
                      <Icon name="Zap" size={18} className="mr-2" />
                      Обновить тариф
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Опишите задачу для бота
                      </label>
                      <Textarea
                        placeholder="Например: Создай бота для приёма заказов в ресторан. Он должен показать меню, принять выбор блюд, уточнить адрес доставки и время, а затем отправить заказ в CRM..."
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        rows={6}
                        className="glass-input"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {currentLimits.textGeneration === -1 
                          ? 'Безлимитное количество генераций' 
                          : `Осталось генераций в этом месяце: ${currentLimits.textGeneration}`}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Icon name="Lightbulb" size={16} className="text-blue-600" />
                        Советы для лучшего результата:
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Опишите цель бота и целевую аудиторию</li>
                        <li>• Укажите, какие действия должен выполнять бот</li>
                        <li>• Перечислите необходимые интеграции (CRM, email, платежи)</li>
                        <li>• Опишите желаемый сценарий диалога</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Icon name="BookOpen" size={16} className="text-green-600" />
                        Примеры промптов:
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded border text-xs">
                          <p className="font-medium text-green-700 mb-1">Ресторан:</p>
                          <p className="text-muted-foreground">"Создай бота для приёма заказов еды. Показывает меню с категориями, принимает выбор блюд, уточняет адрес и время доставки, отправляет заказ в CRM"</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-xs">
                          <p className="font-medium text-green-700 mb-1">Техподдержка:</p>
                          <p className="text-muted-foreground">"Бот для поддержки клиентов. Отвечает на частые вопросы из базы знаний, собирает заявки, передаёт сложные кейсы оператору"</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-xs">
                          <p className="font-medium text-green-700 mb-1">Запись на услуги:</p>
                          <p className="text-muted-foreground">"Бот для салона красоты. Показывает услуги и цены, проверяет свободное время мастеров, записывает клиента, отправляет напоминание"</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full btn-glass-primary"
                      size="lg"
                      onClick={handleGenerateFromText}
                      disabled={isGenerating || !textPrompt.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                          Генерирую бота...
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" size={18} className="mr-2" />
                          Создать бота с помощью AI
                        </>
                      )}
                    </Button>

                    {isGenerating && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Анализирую задачу...</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
                          <span className="text-sm font-medium">Подбираю блоки...</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
                          <span className="text-sm font-medium">Создаю логику...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default BotBuilder;