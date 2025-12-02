export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'code' | 'image' | 'vision';
  free: boolean;
  description?: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'qwen/qwen3-235b-a22:free',
    name: 'Qwen3 235B A22',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Мощная мультиязычная модель для консультаций и помощи'
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder',
    provider: 'OpenRouter',
    type: 'code',
    free: true,
    description: 'Специализированная модель для генерации кода'
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Мощная текстовая модель от Google'
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Сбалансированная модель от Google'
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Компактная быстрая модель от Google'
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Продвинутая модель для рассуждений'
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek Chat V3',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Оптимизированная для диалогов'
  },
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b:free',
    name: 'DeepSeek R1 Distill 70B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Дистиллированная версия R1 на базе Llama'
  },
  {
    id: 'deepseek/deepseek-r1-distill-qwen-14b:free',
    name: 'DeepSeek R1 Distill 14B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Компактная версия R1 на базе Qwen'
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Llama 3.2 Vision',
    provider: 'OpenRouter',
    type: 'vision',
    free: true,
    description: 'Модель для работы с изображениями от Meta'
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT OSS 20B',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Open-source GPT модель'
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Быстрая экспериментальная модель'
  },
  {
    id: 'google/gemini-2.5-flash-image-preview:free',
    name: 'Gemini 2.5 Flash Image (Free)',
    provider: 'OpenRouter',
    type: 'image',
    free: true,
    description: 'Бесплатная генерация изображений от Google'
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Компактная эффективная модель'
  },
  {
    id: 'x-ai/grok-4.1-fast:free',
    name: 'Grok 4.1 Fast',
    provider: 'OpenRouter',
    type: 'text',
    free: true,
    description: 'Быстрая версия Grok от X.AI'
  },
  {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'Kat Coder Pro',
    provider: 'OpenRouter',
    type: 'code',
    free: true,
    description: 'Профессиональная модель для кода'
  },
  {
    id: 'qwen/qwen2.5-vl-32b-instruct:free',
    name: 'Qwen 2.5 Vision 32B',
    provider: 'OpenRouter',
    type: 'vision',
    free: true,
    description: 'Мощная vision-модель от Qwen'
  },
  {
    id: 'qwen/qwen2.5-vl-72b-instruct:free',
    name: 'Qwen 2.5 Vision 72B',
    provider: 'OpenRouter',
    type: 'vision',
    free: true,
    description: 'Топовая vision-модель от Qwen'
  },
  {
    id: 'moonshotai/kimi-vl-a3b-thinking:free',
    name: 'Kimi VL Thinking',
    provider: 'OpenRouter',
    type: 'vision',
    free: true,
    description: 'Компактная vision-модель с рассуждением'
  },
  {
    id: 'openai/dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Топовая модель генерации изображений от OpenAI'
  },
  {
    id: 'black-forest-labs/flux-pro',
    name: 'FLUX Pro',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Профессиональная генерация изображений'
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Превью топовой модели изображений от Google'
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Быстрая генерация изображений'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Топовая модель от Anthropic для текста'
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Самая мощная модель Claude'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Оптимизированная версия GPT-4'
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Быстрая версия GPT-4'
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Профессиональная модель от Google'
  },
  {
    id: 'google/gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'OpenRouter',
    type: 'vision',
    free: false,
    description: 'Gemini Pro с поддержкой изображений'
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'Nemotron Nano VL',
    provider: 'OpenRouter',
    type: 'vision',
    free: false,
    description: 'Компактная vision-модель от NVIDIA'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Мощная модель от Meta'
  },
  {
    id: 'mistralai/mistral-large-2',
    name: 'Mistral Large 2',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Топовая модель от Mistral'
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Продвинутая модель от Cohere'
  },
  {
    id: 'x-ai/grok-2',
    name: 'Grok 2',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Полная версия Grok от X.AI'
  },
  {
    id: 'anthropic/claude-3.5-sonnet-vision',
    name: 'Claude 3.5 Vision',
    provider: 'OpenRouter',
    type: 'vision',
    free: false,
    description: 'Claude 3.5 с поддержкой изображений'
  },
  {
    id: 'openai/gpt-4o-vision',
    name: 'GPT-4o Vision',
    provider: 'OpenRouter',
    type: 'vision',
    free: false,
    description: 'GPT-4o с анализом изображений'
  }
];

export const getModelsByType = (type: 'text' | 'code' | 'image' | 'vision') => {
  return AI_MODELS.filter(model => model.type === type);
};

export const getFreeModels = () => {
  return AI_MODELS.filter(model => model.free);
};

export const getPaidModels = () => {
  return AI_MODELS.filter(model => !model.free);
};

export const getModelsByBotType = (botType: string) => {
  switch (botType) {
    case 'chatbot':
      return AI_MODELS.filter(m => m.type === 'text');
    case 'ai-agent':
      return AI_MODELS.filter(m => m.type === 'text' || m.type === 'code');
    case 'ai-employee':
      return AI_MODELS.filter(m => m.type === 'text');
    case 'photo-bot':
      return AI_MODELS.filter(m => m.type === 'image' || m.type === 'vision');
    default:
      return AI_MODELS.filter(m => m.type === 'text');
  }
};