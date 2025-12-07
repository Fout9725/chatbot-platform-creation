export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface Integration {
  id: string;
  name: string;
  type: 'telegram' | 'whatsapp' | 'instagram' | 'vk' | 'website' | 'api';
  status: 'active' | 'inactive';
  config?: Record<string, any>;
}

export interface Bot {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  rentPrice: number;
  rating: number;
  users: number;
  icon: string;
  features: string[];
  fullDescription?: string;
  functionality?: string[];
  knowledgeBase?: KnowledgeBase[];
  integrations?: Integration[];
  aiModel?: 'gpt-4' | 'gpt-3.5' | 'claude' | 'yandexgpt';
  personality?: string;
  demoUrl?: string;
}

export const categories = ['Все', 'Продажи', 'Поддержка', 'HR', 'Маркетинг', 'Финансы', 'Сервис', 'Креатив', 'Юриспруденция'];