import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AutomationAIAssistant from '@/components/automation/AutomationAIAssistant';

export default function TikTokAutomation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [niche, setNiche] = useState('');

  const generateIdeas = async () => {
    if (!niche) {
      toast({ title: "Укажите тематику", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      setResults({
        ideas: [
          {
            title: `POV: когда ты впервые пробуешь ${niche}`,
            hook: "Не ожидал такого...",
            hashtags: ['fyp', 'viral', niche, 'тренд', 'рек'],
            sound: 'Трендовый звук #1'
          },
          {
            title: `3 ошибки в ${niche}, которые делают все`,
            hook: "Серьёзно, проверь себя прямо сейчас",
            hashtags: ['обучение', niche, 'лайфхаки', 'советы'],
            sound: 'Мотивационный бит'
          },
          {
            title: `Как ${niche} изменил мою жизнь за месяц`,
            hook: "Результаты шокируют даже меня",
            hashtags: ['результаты', niche, 'мотивация', 'истории'],
            sound: 'Эмоциональная музыка'
          }
        ],
        script_tips: [
          'Первые 3 секунды решают всё - крючок должен быть ярким',
          'Используй быструю смену кадров (каждые 1-2 секунды)',
          'Добавь текстовые оверлеи для удержания внимания',
          'Закончи призывом к действию (лайк, подписка, комментарий)'
        ],
        trending_sounds: [
          'Original Sound - Trending Mix',
          'Viral Dance Beat 2024',
          'Motivation Speech Remix'
        ]
      });
      
      setIsGenerating(false);
      toast({ title: "Идеи готовы!", description: "Используйте для создания контента" });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/automation-hub')}>
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад
        </Button>
      </div>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-400 to-rose-600 p-3 rounded-xl">
              <Icon name="Video" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Идеи для TikTok / Reels / Shorts</CardTitle>
              <CardDescription>Генератор идей для коротких видео</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Icon name="Info" size={16} />
            <AlertDescription>
              Получите вирусные идеи для короткого вертикального контента
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Тематика контента *</label>
              <Input
                placeholder="Например: фитнес, кулинария, юмор..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="mt-1"
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

          {results && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Идеи для видео:</h3>
                <div className="space-y-4">
                  {results.ideas.map((idea: any, idx: number) => (
                    <Card key={idx} className="border">
                      <CardHeader>
                        <CardTitle className="text-md">{idea.title}</CardTitle>
                        <CardDescription className="font-semibold text-primary">
                          🎣 Крючок: "{idea.hook}"
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Music" size={14} />
                          <span className="text-muted-foreground">{idea.sound}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {idea.hashtags.map((tag: string, tagIdx: number) => (
                            <Badge key={tagIdx} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="border-primary/20 border-2">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Icon name="Film" size={18} />
                    Советы по сценарию:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.script_tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Icon name="CheckCircle2" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 border-2">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Icon name="Music" size={18} />
                    Трендовые звуки:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.trending_sounds.map((sound: string, idx: number) => (
                      <li key={idx} className="text-sm p-2 bg-secondary/10 rounded flex items-center gap-2">
                        <Icon name="TrendingUp" size={14} className="text-green-600" />
                        {sound}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      <AutomationAIAssistant
        platform="tiktok"
        formData={{ niche }}
      />
    </div>
  );
}