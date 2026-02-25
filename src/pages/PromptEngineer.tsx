import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const PROMPT_API = 'https://functions.poehali.dev/6b952156-c637-4843-9ac7-f3f8ebe94378';

interface ModelInfo {
  id: string;
  name: string;
  icon: string;
  type: string;
  lang: string;
  speed: string;
  description: string;
  bestFor: string;
  promptTips: string[];
  examples: string[];
}

const MODELS: ModelInfo[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT (GPT-4o)',
    icon: '🧠',
    type: 'Текстовая',
    lang: 'Русский / Английский',
    speed: 'Быстрая',
    description: 'Универсальная языковая модель OpenAI для текстовых задач любой сложности.',
    bestFor: 'Написание текстов, код, анализ данных, креатив, бизнес-задачи',
    promptTips: [
      'Указывайте роль: "Ты — опытный маркетолог с 10-летним стажем"',
      'Задавайте формат вывода: "Ответ в виде таблицы / JSON / списка"',
      'Используйте примеры (Few-Shot): покажите 1-2 примера желаемого результата',
      'Ограничивайте объём: "Ответ не более 300 слов"'
    ],
    examples: [
      'Напиши продающий текст для лендинга стартапа по доставке еды',
      'Проанализируй отзывы клиентов и выдели 5 главных проблем',
      'Создай контент-план на месяц для Instagram магазина одежды'
    ]
  },
  {
    id: 'claude',
    name: 'Claude 3.5 (Anthropic)',
    icon: '🟣',
    type: 'Текстовая',
    lang: 'Русский / Английский',
    speed: 'Быстрая',
    description: 'Безопасная модель Anthropic, отлично работает с длинными документами и сложным анализом.',
    bestFor: 'Работа с документами, юридические тексты, длинные анализы, код',
    promptTips: [
      'Claude отлично работает с XML-тегами: <context>ваш текст</context>',
      'Для сложных задач используйте Chain of Thought: "Думай пошагово"',
      'Указывайте ограничения: "Отвечай ТОЛЬКО на основе предоставленного текста"',
      'Для точности: "Если не уверен — скажи об этом прямо"'
    ],
    examples: [
      'Проанализируй этот договор и найди потенциальные риски для арендатора',
      'Перепиши техническую документацию простым языком для пользователей',
      'Сравни два подхода к решению задачи и выбери оптимальный'
    ]
  },
  {
    id: 'midjourney',
    name: 'Midjourney v6',
    icon: '🎨',
    type: 'Генерация изображений',
    lang: 'Английский',
    speed: 'Средняя (30-60 сек)',
    description: 'Лидер генерации изображений. Создаёт фотореалистичные и художественные картинки.',
    bestFor: 'Иллюстрации, концепт-арт, фото-реализм, логотипы, арт',
    promptTips: [
      'Описывайте: объект + стиль + свет + ракурс + детали',
      'Добавляйте параметры: --ar 16:9 (соотношение), --style raw (реализм)',
      'Используйте стилевые слова: cinematic, editorial, minimalist, hyper-detailed',
      'Указывайте камеру: shot on Canon EOS R5, 85mm lens, f/1.4'
    ],
    examples: [
      'Futuristic city at sunset, neon lights reflecting in rain puddles, cyberpunk style --ar 16:9',
      'Professional headshot of a CEO, studio lighting, clean background --ar 1:1',
      'Watercolor illustration of a cozy cat cafe, warm tones, soft light --ar 3:4'
    ]
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion XL',
    icon: '🖼️',
    type: 'Генерация изображений',
    lang: 'Английский',
    speed: 'Быстрая (10-30 сек)',
    description: 'Open-source модель для генерации изображений. Гибкая настройка через промпты и параметры.',
    bestFor: 'Фотореализм, стилизация, обработка фото, рекламные баннеры',
    promptTips: [
      'Начинайте с главного объекта, затем детали окружения',
      'Используйте веса: (important detail:1.3) или [less important:0.7]',
      'Негативный промпт обязателен: blurry, low quality, deformed',
      'Качество: masterpiece, best quality, highly detailed, 8k, photorealistic'
    ],
    examples: [
      'A portrait of a young woman, golden hour, soft bokeh, shot on 35mm film, warm tones',
      'Modern minimalist logo design for tech startup, clean lines, gradient blue',
      'Interior design of a Scandinavian living room, natural wood, soft textiles, daylight'
    ]
  },
  {
    id: 'flux',
    name: 'FLUX Pro / Dev',
    icon: '⚡',
    type: 'Генерация изображений',
    lang: 'Английский',
    speed: 'Быстрая (5-20 сек)',
    description: 'Новейшая модель от Black Forest Labs. Отличная работа с текстом на изображениях и фотореализм.',
    bestFor: 'Текст на картинках, фотореализм, баннеры, mockup-ы',
    promptTips: [
      'FLUX отлично рендерит текст — указывайте нужный текст в кавычках',
      'Детальные описания работают лучше коротких',
      'Указывайте стиль фотографии: editorial, documentary, fashion',
      'Для текста: A sign that says "YOUR TEXT HERE" in bold letters'
    ],
    examples: [
      'A coffee shop menu board that says "Morning Brew" in elegant chalk lettering',
      'Professional product photo of a smartphone on marble surface, studio lighting',
      'Book cover design with title "The Last Algorithm" in futuristic font, sci-fi theme'
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini Flash (Google)',
    icon: '🟢',
    type: 'Текст + Изображения',
    lang: 'Русский / Английский',
    speed: 'Быстрая',
    description: 'Мультимодальная модель Google. Генерирует и редактирует изображения, понимает русский.',
    bestFor: 'Генерация изображений на русском, редактирование фото, мультимодальные задачи',
    promptTips: [
      'Можно писать промпты на русском — Gemini хорошо понимает',
      'Для редактирования: загрузите фото + опишите изменения',
      'Детально описывайте настроение и атмосферу',
      'Комбинируйте текст и изображение для лучших результатов'
    ],
    examples: [
      'Нарисуй уютную кофейню в осеннем парке, тёплые тона, мягкий свет',
      'Сделай фон этого фото осенним с золотыми листьями',
      'Преврати портрет в стиль акварельной живописи'
    ]
  },
  {
    id: 'suno',
    name: 'Suno AI',
    icon: '🎵',
    type: 'Генерация музыки',
    lang: 'Русский / Английский',
    speed: 'Средняя (30-90 сек)',
    description: 'AI-генератор музыки. Создаёт полноценные треки с вокалом по текстовому описанию.',
    bestFor: 'Джинглы, фоновая музыка, песни, подкаст-интро',
    promptTips: [
      'Указывайте жанр: pop, rock, jazz, electronic, lo-fi',
      'Опишите настроение: upbeat, melancholic, energetic, calm',
      'Укажите инструменты: acoustic guitar, piano, synth, drums',
      'Для вокала: укажите стиль пения и язык'
    ],
    examples: [
      'Upbeat electronic track for a tech startup promo video, 120 BPM, synth and drums',
      'Calm lo-fi hip hop beat for studying, soft piano, vinyl crackle',
      'Энергичная поп-песня на русском о лете и свободе'
    ]
  }
];

const CATEGORIES = [
  { id: 'all', name: 'Все модели', icon: 'LayoutGrid' },
  { id: 'text', name: 'Текстовые', icon: 'MessageSquare' },
  { id: 'image', name: 'Изображения', icon: 'Image' },
  { id: 'multi', name: 'Мультимодальные', icon: 'Layers' },
  { id: 'audio', name: 'Аудио', icon: 'Music' }
];

function filterModels(category: string) {
  if (category === 'all') return MODELS;
  if (category === 'text') return MODELS.filter(m => m.type === 'Текстовая');
  if (category === 'image') return MODELS.filter(m => m.type === 'Генерация изображений');
  if (category === 'multi') return MODELS.filter(m => m.type.includes('+'));
  if (category === 'audio') return MODELS.filter(m => m.type.includes('музык'));
  return MODELS;
}

const PromptEngineer = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [category, setCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!userRequest.trim()) return;
    setIsLoading(true);
    setError('');
    setGeneratedPrompt('');

    try {
      const res = await fetch(PROMPT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: userRequest,
          target_model: selectedModel || ''
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка генерации');
      } else {
        setGeneratedPrompt(data.prompt || '');
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (e) {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const filteredModels = filterModels(category);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-fuchsia-500/4 rounded-full blur-[150px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-2.5 rounded-xl shadow-lg shadow-violet-500/20">
                  <Icon name="Sparkles" className="text-white" size={26} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  Промт-Инженер
                </h1>
                <p className="text-[11px] text-white/40 tracking-wider uppercase">AI Meta-Prompt Engineer</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="Home" size={16} className="mr-1.5" />
                  Главная
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="LayoutDashboard" size={16} className="mr-1.5" />
                  Панель
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-4">
            <Icon name="Zap" size={14} />
            Powered by nvidia/nemotron AI
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              Создавайте идеальные промты
            </span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            AI-инженер составит структурированный промт для любой нейросети по вашему описанию на русском языке
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-8 mx-auto flex w-fit">
            <TabsTrigger value="generator" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="Sparkles" size={16} className="mr-2" />
              Генератор промтов
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="BookOpen" size={16} className="mr-2" />
              Справочник моделей
            </TabsTrigger>
            <TabsTrigger value="guide" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="GraduationCap" size={16} className="mr-2" />
              Гайд по промтам
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-white/[0.03] border-white/10 shadow-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Icon name="PenTool" size={18} className="text-violet-400" />
                      Ваш запрос
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-white/50 text-sm mb-2 block">Целевая нейросеть (необязательно)</label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Любая нейросеть" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="any" className="text-white">Универсальный промпт</SelectItem>
                          {MODELS.map(m => (
                            <SelectItem key={m.id} value={m.name} className="text-white">
                              {m.icon} {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-white/50 text-sm mb-2 block">Опишите задачу своими словами</label>
                      <Textarea
                        value={userRequest}
                        onChange={(e) => setUserRequest(e.target.value)}
                        placeholder="Например: Нужен промт для генерации логотипа стартапа CloudSwift в Midjourney. Символ — облако и молния. Минимализм, синий и белый градиент."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 min-h-[180px] resize-none focus:border-violet-500/50 focus:ring-violet-500/20"
                      />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={isLoading || !userRequest.trim()}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium h-11 shadow-lg shadow-violet-500/20"
                    >
                      {isLoading ? (
                        <>
                          <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                          AI составляет промт...
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" size={18} className="mr-2" />
                          Создать промт
                        </>
                      )}
                    </Button>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        <Icon name="AlertCircle" size={14} className="inline mr-1.5" />
                        {error}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="pt-5">
                    <h4 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
                      <Icon name="Lightbulb" size={14} className="text-amber-400" />
                      Примеры запросов
                    </h4>
                    <div className="space-y-2">
                      {[
                        'Промт для написания продающего текста лендинга фитнес-приложения',
                        'Промт для Midjourney: портрет киберпанк-девушки с неоновым светом',
                        'Промт для анализа отзывов клиентов и выделения ключевых проблем',
                        'Промт для FLUX: баннер интернет-магазина с текстом "СКИДКИ -50%"',
                        'Промт для создания контент-плана Telegram-канала на месяц'
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setUserRequest(example)}
                          className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-violet-500/20 text-white/50 hover:text-white/80 text-sm transition-all"
                        >
                          <Icon name="ArrowRight" size={12} className="inline mr-2 text-violet-400" />
                          {example}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3" ref={resultRef}>
                {generatedPrompt ? (
                  <Card className="bg-white/[0.03] border-white/10 shadow-2xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <Icon name="FileCheck" size={18} className="text-green-400" />
                          Готовый промт
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="text-white/50 hover:text-white hover:bg-white/5"
                        >
                          <Icon name={copied ? "Check" : "Copy"} size={16} className="mr-1.5" />
                          {copied ? 'Скопировано!' : 'Копировать'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-black/40 rounded-xl p-5 border border-white/5 font-mono text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                        {generatedPrompt}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                        >
                          <Icon name="Copy" size={14} className="mr-1.5" />
                          Копировать промт
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setGeneratedPrompt(''); setUserRequest(''); }}
                          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                        >
                          <Icon name="RefreshCw" size={14} className="mr-1.5" />
                          Новый запрос
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/[0.03] border-white/10 border-dashed">
                    <CardContent className="py-20 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Icon name="Sparkles" size={36} className="text-violet-400/60" />
                      </div>
                      <h3 className="text-xl font-semibold text-white/70 mb-2">Промт появится здесь</h3>
                      <p className="text-white/40 max-w-md mx-auto">
                        Опишите задачу в поле слева, выберите модель и нажмите «Создать промт». 
                        AI-инженер составит структурированный промт за секунды.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={category === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.id)}
                  className={category === cat.id
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'}
                >
                  <Icon name={cat.icon} size={14} className="mr-1.5" />
                  {cat.name}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModels.map(model => (
                <Card
                  key={model.id}
                  className={`bg-white/[0.03] border-white/10 cursor-pointer transition-all hover:border-violet-500/30 hover:bg-white/[0.05] ${expandedModel === model.id ? 'border-violet-500/40 bg-white/[0.05]' : ''}`}
                  onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{model.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base">{model.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{model.type}</Badge>
                          <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{model.lang}</Badge>
                          <Badge variant="outline" className="border-cyan-500/20 text-cyan-300/70 text-[10px]">{model.speed}</Badge>
                        </div>
                      </div>
                      <Icon name={expandedModel === model.id ? "ChevronUp" : "ChevronDown"} size={18} className="text-white/30" />
                    </div>

                    <p className="text-white/50 text-sm mb-2">{model.description}</p>
                    <p className="text-white/40 text-xs">
                      <span className="text-violet-300/70 font-medium">Лучше всего для:</span> {model.bestFor}
                    </p>

                    {expandedModel === model.id && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2">
                        <div>
                          <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1.5">
                            <Icon name="Target" size={13} className="text-violet-400" />
                            Советы по промтам
                          </h4>
                          <ul className="space-y-1.5">
                            {model.promptTips.map((tip, i) => (
                              <li key={i} className="text-white/45 text-sm flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1.5">
                            <Icon name="MessageSquare" size={13} className="text-cyan-400" />
                            Примеры промтов
                          </h4>
                          <div className="space-y-1.5">
                            {model.examples.map((ex, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-white/50 text-xs font-mono">
                                {ex}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModel(model.name);
                            setActiveTab('generator');
                          }}
                          className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20"
                        >
                          <Icon name="ArrowRight" size={14} className="mr-1.5" />
                          Создать промт для {model.name}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guide">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="BookOpen" size={20} className="text-violet-400" />
                    Что такое промт-инженерия?
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    Промт-инженерия — это искусство составления запросов к нейросетям так, чтобы получить максимально 
                    точный и полезный результат. Хороший промт — это разница между размытым ответом и идеальным решением.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="Layers" size={20} className="text-cyan-400" />
                    Фреймворк COSTAR
                  </h3>
                  <p className="text-white/50 mb-4">Универсальная структура для создания промтов:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { letter: 'C', word: 'Context', desc: 'Контекст — опишите ситуацию и предысторию' },
                      { letter: 'O', word: 'Objective', desc: 'Цель — что конкретно нужно получить' },
                      { letter: 'S', word: 'Steps', desc: 'Шаги — пошаговая инструкция выполнения' },
                      { letter: 'T', word: 'Tone', desc: 'Тон — стиль и подача (формальный, дружелюбный)' },
                      { letter: 'A', word: 'Audience', desc: 'Аудитория — для кого предназначен результат' },
                      { letter: 'R', word: 'Response', desc: 'Формат ответа — таблица, список, JSON и др.' }
                    ].map(item => (
                      <div key={item.letter} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-lg">
                          {item.letter}
                        </div>
                        <div>
                          <span className="text-white font-medium text-sm">{item.word}</span>
                          <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="Lightbulb" size={20} className="text-amber-400" />
                    Топ-5 техник промтинга
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: '1. Ролевое моделирование',
                        desc: 'Задайте роль: "Ты — опытный UX-дизайнер с 10-летним стажем". Модель будет отвечать с экспертизой этой роли.',
                        example: 'Ты — Senior Python-разработчик в крупной IT-компании. Проведи код-ревью этой функции...'
                      },
                      {
                        title: '2. Chain of Thought (CoT)',
                        desc: 'Попросите модель думать пошагово. Это повышает точность сложных задач на 40-70%.',
                        example: 'Давай решим эту задачу пошагово. Сначала определим входные данные, затем...'
                      },
                      {
                        title: '3. Few-Shot примеры',
                        desc: 'Покажите 1-3 примера желаемого результата. Модель быстро поймёт паттерн.',
                        example: 'Вход: "Отличный сервис!" → Тональность: Позитивная\nВход: "Ужасная доставка" → Тональность: Негативная\nВход: "Нормально" → ?'
                      },
                      {
                        title: '4. Ограничения и барьеры',
                        desc: 'Четко ограничьте модель: формат, длину, что можно/нельзя делать.',
                        example: 'Ответ ТОЛЬКО на основе предоставленного текста. Не более 200 слов. Формат: маркированный список.'
                      },
                      {
                        title: '5. Итеративный подход',
                        desc: 'Не бойтесь уточнять: "Хорошо, теперь сделай более формально" или "Добавь больше деталей к пункту 3".',
                        example: 'Отлично, теперь переработай раздел "Преимущества" — добавь конкретные цифры и кейсы.'
                      }
                    ].map(item => (
                      <div key={item.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                        <p className="text-white/50 text-sm mb-2">{item.desc}</p>
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-white/40 text-xs font-mono">
                          {item.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                <CardContent className="pt-6 text-center">
                  <Icon name="Rocket" size={36} className="text-violet-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Готовы создать свой промт?</h3>
                  <p className="text-white/50 mb-4">Наш AI-инженер применит все эти техники автоматически</p>
                  <Button
                    onClick={() => setActiveTab('generator')}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                  >
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Перейти к генератору
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PromptEngineer;
