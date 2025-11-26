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
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Топовая модель для генерации изображений'
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Компактная версия GPT-5 для изображений'
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Полная версия GPT-5 для изображений'
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
    id: 'google/gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash Image Preview',
    provider: 'OpenRouter',
    type: 'image',
    free: false,
    description: 'Превью версия генератора изображений'
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Мощная текстовая модель (превью)'
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'Nemotron Nano VL',
    provider: 'OpenRouter',
    type: 'vision',
    free: false,
    description: 'Модель для работы с изображениями и текстом'
  },
  {
    id: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash Preview',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Превью-версия Gemini 2.5'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Стабильная версия Gemini 2.5'
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Новейшая версия GPT'
  },
  {
    id: 'openai/gpt-5.1-chat',
    name: 'GPT-5.1 Chat',
    provider: 'OpenRouter',
    type: 'text',
    free: false,
    description: 'Оптимизированная для чата версия GPT-5.1'
  },
  {
    id: 'openai/gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    provider: 'OpenRouter',
    type: 'code',
    free: false,
    description: 'Специализированная для кода версия GPT-5.1'
  },
  {
    id: 'openai/gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    provider: 'OpenRouter',
    type: 'code',
    free: false,
    description: 'Компактная кодовая модель GPT-5.1'
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
