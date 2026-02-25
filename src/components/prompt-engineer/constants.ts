export const PROMPT_API = 'https://functions.poehali.dev/6b952156-c637-4843-9ac7-f3f8ebe94378';

export interface ModelInfo {
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

export const MODELS: ModelInfo[] = [
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

export const CATEGORIES = [
  { id: 'all', name: 'Все модели', icon: 'LayoutGrid' },
  { id: 'text', name: 'Текстовые', icon: 'MessageSquare' },
  { id: 'image', name: 'Изображения', icon: 'Image' },
  { id: 'multi', name: 'Мультимодальные', icon: 'Layers' },
  { id: 'audio', name: 'Аудио', icon: 'Music' }
];

export function filterModels(category: string) {
  if (category === 'all') return MODELS;
  if (category === 'text') return MODELS.filter(m => m.type === 'Текстовая');
  if (category === 'image') return MODELS.filter(m => m.type === 'Генерация изображений');
  if (category === 'multi') return MODELS.filter(m => m.type.includes('+'));
  if (category === 'audio') return MODELS.filter(m => m.type.includes('музык'));
  return MODELS;
}
