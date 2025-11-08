import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TelegramIntegration from '@/components/TelegramIntegration';
import SocialMediaGuide from '@/components/SocialMediaGuide';
import BotTraining from '@/components/BotTraining';
import AITools from '@/components/AITools';
import APIKeysManager from '@/components/APIKeysManager';

interface ScenarioNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action';
  title: string;
  content?: string;
}

const BotConstructor = () => {
  const { toast } = useToast();
  const [botName, setBotName] = useState('');
  const [botType, setBotType] = useState('');
  const [platform, setPlatform] = useState('');
  const [description, setDescription] = useState('');
  const [aiModel, setAiModel] = useState('deepseek');
  const [aiPrompt, setAiPrompt] = useState('Ты вежливый помощник. Отвечай кратко и по делу.');
  const [scenarios, setScenarios] = useState<ScenarioNode[]>([
    { id: '1', type: 'start', title: 'Начало диалога' }
  ]);

  const nodeTypes = [
    { type: 'message', icon: 'MessageSquare', label: 'Сообщение', color: 'bg-blue-100 text-blue-700' },
    { type: 'question', icon: 'HelpCircle', label: 'Вопрос', color: 'bg-green-100 text-green-700' },
    { type: 'condition', icon: 'GitBranch', label: 'Условие', color: 'bg-yellow-100 text-yellow-700' },
    { type: 'action', icon: 'Zap', label: 'Действие', color: 'bg-purple-100 text-purple-700' },
  ];

  const handleAddNode = (type: string) => {
    const newNode: ScenarioNode = {
      id: Date.now().toString(),
      type: type as any,
      title: `Новый ${type}`,
    };
    setScenarios([...scenarios, newNode]);
  };

  const handleCreateBot = async () => {
    if (!botName || !botType || !platform) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/96b3f1ab-3e6d-476d-9886-020600efada2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: botName,
          bot_type: botType,
          platform: platform,
          description: description,
          ai_model: aiModel,
          ai_prompt: aiPrompt,
          scenarios: scenarios,
          telegram_token: platform === 'telegram' ? '8059737467:AAEywpOOuZBvzCu35gSqZetsxgZzwULHCjc' : null,
        })
      });

      const data = await response.json();

      if (response.ok && data.bot) {
        toast({
          title: 'Бот создан!',
          description: `Бот "${botName}" успешно создан и сохранен в базе данных`,
        });
        
        setBotName('');
        setBotType('');
        setPlatform('');
        setDescription('');
        setAiModel('deepseek');
        setAiPrompt('Ты вежливый помощник. Отвечай кратко и по делу.');
        setScenarios([{ id: '1', type: 'start', title: 'Начало диалога' }]);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать бота',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением к серверу',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-1 space-y-4 md:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Icon name="Settings" size={18} className="md:w-5 md:h-5" />
              Настройки бота
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Основные параметры вашего ИИ-агента</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Название бота *</Label>
              <Input
                id="bot-name"
                placeholder="Мой помощник"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-type">Тип бота *</Label>
              <Select value={botType} onValueChange={setBotType}>
                <SelectTrigger id="bot-type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chatbot">Чат-бот</SelectItem>
                  <SelectItem value="ai-agent">ИИ-агент</SelectItem>
                  <SelectItem value="ai-employee">ИИ-сотрудник</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Платформа *</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Выберите платформу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="vk">ВКонтакте</SelectItem>
                  <SelectItem value="web">Веб-сайт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Опишите назначение бота..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle" size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold mb-1">Умный бот без API ключей!</p>
                  <p className="text-xs">
                    Бот использует встроенное машинное обучение и самообучается на диалогах.
                    Никаких внешних сервисов не требуется.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleCreateBot} className="w-full" size="lg">
              <Icon name="Rocket" size={18} className="mr-2" />
              Создать бота
            </Button>
          </CardContent>
        </Card>

        <div className="hidden lg:block space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Элементы сценария</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nodeTypes.map((node) => (
                <Button
                  key={node.type}
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => handleAddNode(node.type)}
                >
                  <Icon name={node.icon as any} size={16} className="mr-2" />
                  {node.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {platform === 'telegram' && (
            <div className="mt-4">
              <TelegramIntegration />
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Icon name="Workflow" size={18} className="md:w-5 md:h-5" />
              Визуальный конструктор
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Создайте сценарий взаимодействия с пользователем</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full max-w-4xl grid-cols-5">
                <TabsTrigger value="visual" className="text-xs md:text-sm">
                  <Icon name="Network" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                  Визуально
                </TabsTrigger>
                <TabsTrigger value="training" className="text-xs md:text-sm">
                  <Icon name="Brain" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                  Обучение
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="text-xs md:text-sm">
                  <Icon name="Sparkles" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                  AI Tools
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs md:text-sm">
                  <Icon name="Key" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                  Интеграции
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs md:text-sm">
                  <Icon name="Code" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                  Код
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="mt-4 md:mt-6">
                <div className="border-2 border-dashed rounded-lg p-4 md:p-8 min-h-[400px] md:min-h-[500px] bg-gradient-to-br from-gray-50 to-white">
                  <div className="lg:hidden mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {nodeTypes.map((node) => (
                        <Button
                          key={node.type}
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs"
                          onClick={() => handleAddNode(node.type)}
                        >
                          <Icon name={node.icon as any} size={14} className="mr-1" />
                          {node.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {scenarios.map((node, index) => (
                      <div
                        key={node.id}
                        className="bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all animate-scale-in hover:border-primary/30"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              node.type === 'start' ? 'bg-primary/10 text-primary' :
                              node.type === 'message' ? 'bg-blue-100 text-blue-700' :
                              node.type === 'question' ? 'bg-green-100 text-green-700' :
                              node.type === 'condition' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              <Icon 
                                name={
                                  node.type === 'start' ? 'Play' :
                                  node.type === 'message' ? 'MessageSquare' :
                                  node.type === 'question' ? 'HelpCircle' :
                                  node.type === 'condition' ? 'GitBranch' :
                                  'Zap'
                                } 
                                size={20} 
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold">{node.title}</h4>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {node.type === 'start' ? 'Старт' :
                                 node.type === 'message' ? 'Сообщение' :
                                 node.type === 'question' ? 'Вопрос' :
                                 node.type === 'condition' ? 'Условие' : 'Действие'}
                              </Badge>
                            </div>
                          </div>
                          {node.type !== 'start' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setScenarios(scenarios.filter(s => s.id !== node.id))}
                            >
                              <Icon name="Trash2" size={16} className="text-destructive" />
                            </Button>
                          )}
                        </div>
                        {index < scenarios.length - 1 && (
                          <div className="flex justify-center mt-3">
                            <Icon name="ArrowDown" size={20} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {scenarios.length === 1 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Icon name="MousePointerClick" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Добавьте элементы из панели слева</p>
                        <p className="text-sm mt-2">для создания сценария диалога</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="training" className="mt-6">
                <BotTraining />
              </TabsContent>

              <TabsContent value="ai-tools" className="mt-6">
                <AITools />
              </TabsContent>

              <TabsContent value="integrations" className="mt-6">
                <APIKeysManager />
              </TabsContent>

              <TabsContent value="code" className="mt-6">
                <div className="bg-gray-900 rounded-lg p-6 min-h-[500px] font-mono text-sm text-green-400">
                  <pre>{JSON.stringify({ botName, botType, platform, description, scenarios }, null, 2)}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6">
          <SocialMediaGuide />
        </div>
      </div>
    </div>
  );
};

export default BotConstructor;