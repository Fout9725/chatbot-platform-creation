import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function YouTubeAutomation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    niche: '',
    keywords: '',
    targetAudience: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateIdeas = async () => {
    if (!formData.niche) {
      toast({
        title: "Укажите нишу",
        description: "Тематика канала обязательна для генерации идей",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Симуляция генерации (в реальности здесь будет запрос к ИИ API)
    setTimeout(() => {
      setResults({
        ideas: [
          {
            title: `Топ-10 секретов ${formData.niche} для начинающих`,
            description: `Подробный гайд по ${formData.niche} с пошаговыми инструкциями. Разбираем основные ошибки новичков и даём проверенные советы.`,
            tags: ['гайд', formData.niche, 'для начинающих', 'обучение', 'советы'],
            duration: '10-12 минут'
          },
          {
            title: `Как я заработал на ${formData.niche} - Честная история`,
            description: `Делюсь реальным опытом монетизации ${formData.niche}. Показываю цифры, инструменты и стратегии.`,
            tags: ['заработок', formData.niche, 'монетизация', 'опыт', 'кейс'],
            duration: '8-10 минут'
          },
          {
            title: `${formData.niche} в 2024: Тренды и прогнозы`,
            description: `Анализируем текущие тренды в ${formData.niche} и делаем прогнозы на будущее. Что будет актуально?`,
            tags: ['тренды', formData.niche, '2024', 'прогнозы', 'аналитика'],
            duration: '12-15 минут'
          }
        ],
        thumbnail_tips: [
          'Яркий контрастный фон',
          'Крупный текст (не более 5 слов)',
          'Ваше фото с эмоцией',
          'Стрелки и акценты на ключевых элементах'
        ],
        hook_examples: [
          `Большинство совершают ЭТУ ошибку в ${formData.niche}...`,
          `Я потратил 5 лет на ${formData.niche} и вот что я узнал`,
          `Никто не говорит об ЭТОМ в ${formData.niche}`
        ]
      });
      
      setIsGenerating(false);
      toast({
        title: "Идеи сгенерированы!",
        description: "Используйте их для создания контента"
      });
    }, 2000);
  };

  const copyIdea = (idea: any) => {
    const text = `Название: ${idea.title}\n\nОписание: ${idea.description}\n\nТеги: ${idea.tags.join(', ')}\n\nДлительность: ${idea.duration}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Скопировано!", description: "Идея скопирована в буфер обмена" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/automation-hub')}>
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад к автоматизациям
        </Button>
      </div>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl">
              <Icon name="Youtube" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Генератор идей для YouTube</CardTitle>
              <CardDescription>ИИ-генерация названий, описаний и тегов для видео</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройка
              </TabsTrigger>
              <TabsTrigger value="results">
                <Icon name="Lightbulb" size={16} className="mr-2" />
                Идеи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <Alert>
                <Icon name="Info" size={16} />
                <AlertDescription>
                  Укажите тематику вашего канала для генерации персонализированных идей
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="niche">Тематика канала *</Label>
                  <Input
                    id="niche"
                    placeholder="Например: программирование, фитнес, маркетинг..."
                    value={formData.niche}
                    onChange={(e) => handleInputChange('niche', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Ключевые слова (через запятую)</Label>
                  <Input
                    id="keywords"
                    placeholder="python, туториал, для начинающих..."
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Целевая аудитория</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Например: начинающие разработчики 18-35 лет"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={generateIdeas} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Icon name="Sparkles" size={18} className="mr-2" />
                      Сгенерировать идеи
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {results ? (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Идеи для видео:</h3>
                    {results.ideas.map((idea: any, idx: number) => (
                      <Card key={idx} className="border">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{idea.title}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => copyIdea(idea)}>
                              <Icon name="Copy" size={16} />
                            </Button>
                          </div>
                          <CardDescription>{idea.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon name="Clock" size={14} />
                            <span>{idea.duration}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {idea.tags.map((tag: string, tagIdx: number) => (
                              <Badge key={tagIdx} variant="secondary">#{tag}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-primary/20 border-2">
                    <CardHeader>
                      <CardTitle className="text-md">Советы по превью:</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.thumbnail_tips.map((tip: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Icon name="CheckCircle2" size={16} className="text-green-600 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-secondary/20 border-2">
                    <CardHeader>
                      <CardTitle className="text-md">Примеры крючков (hooks):</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.hook_examples.map((hook: string, idx: number) => (
                          <li key={idx} className="text-sm p-2 bg-secondary/10 rounded">
                            "{hook}"
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert>
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>
                    Сначала заполните настройки и сгенерируйте идеи
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
