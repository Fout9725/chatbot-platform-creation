import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface APIKey {
  id: string;
  name: string;
  description: string;
  provider: string;
  website: string;
  isFree: boolean;
  features: string[];
  placeholder: string;
  saved: boolean;
}

const apiKeys: APIKey[] = [
  {
    id: 'together',
    name: 'Together AI',
    description: 'Бесплатная генерация изображений через FLUX',
    provider: 'Together AI',
    website: 'https://api.together.xyz',
    isFree: true,
    features: ['FLUX Schnell (быстро)', 'Stable Diffusion XL', '100 бесплатных запросов/день', 'Высокое качество'],
    placeholder: 'xxx...',
    saved: false
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Бесплатная продвинутая языковая модель',
    provider: 'DeepSeek',
    website: 'https://platform.deepseek.com',
    isFree: true,
    features: ['DeepSeek-Chat (GPT-4 уровень)', '50M токенов бесплатно', 'Быстрые ответы', 'Русский язык'],
    placeholder: 'sk-...',
    saved: true
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Сверхбыстрые бесплатные LLM модели',
    provider: 'Groq',
    website: 'https://console.groq.com',
    isFree: true,
    features: ['Llama 3.1 70B', 'Mixtral 8x7B', '14,400 запросов/день', 'Мгновенные ответы (<1 сек)'],
    placeholder: 'gsk_...',
    saved: true
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Тысячи бесплатных AI моделей',
    provider: 'Hugging Face',
    website: 'https://huggingface.co/settings/tokens',
    isFree: true,
    features: ['Модели для текста, изображений, аудио', 'Неограниченный доступ', 'Inference API', 'Community модели'],
    placeholder: 'hf_...',
    saved: false
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'API для AI моделей (лимитированный бесплатный тариф)',
    provider: 'Replicate',
    website: 'https://replicate.com',
    isFree: true,
    features: ['Stable Diffusion', 'FLUX', 'LLM модели', '$10 бесплатных кредитов'],
    placeholder: 'r8_...',
    saved: false
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion и другие генеративные модели',
    provider: 'Stability AI',
    website: 'https://platform.stability.ai',
    isFree: false,
    features: ['Stable Diffusion 3', 'Ultra качество', 'Video generation', '$10 при регистрации'],
    placeholder: 'sk-...',
    saved: false
  }
];

export default function APIKeysManager() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleSaveKey = (keyId: string) => {
    const value = keys[keyId];
    if (!value || value.trim() === '') {
      toast({
        title: 'Ошибка',
        description: 'Введите API ключ',
        variant: 'destructive'
      });
      return;
    }

    localStorage.setItem(`api_key_${keyId}`, value);
    toast({
      title: 'API ключ сохранён',
      description: 'Теперь вы можете использовать этот сервис в ботах'
    });

    const keyIndex = apiKeys.findIndex(k => k.id === keyId);
    if (keyIndex !== -1) {
      apiKeys[keyIndex].saved = true;
    }
  };

  const handleRemoveKey = (keyId: string) => {
    localStorage.removeItem(`api_key_${keyId}`);
    setKeys({ ...keys, [keyId]: '' });
    toast({
      title: 'API ключ удалён',
      description: 'Ключ успешно удалён из хранилища'
    });

    const keyIndex = apiKeys.findIndex(k => k.id === keyId);
    if (keyIndex !== -1) {
      apiKeys[keyIndex].saved = false;
    }
  };

  const toggleShowKey = (keyId: string) => {
    setShowKey({ ...showKey, [keyId]: !showKey[keyId] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Key" size={24} />
          Управление API ключами
        </CardTitle>
        <CardDescription>
          Подключите бесплатные нейросети для расширения возможностей ботов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Ваши ключи в безопасности</p>
              <p className="text-xs">
                Все API ключи хранятся локально в вашем браузере и никуда не отправляются.
                Вы можете добавлять только бесплатные сервисы без привязки карты.
              </p>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {apiKeys.map((key) => (
            <AccordionItem key={key.id} value={key.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 flex-1 text-left">
                  <Icon name={key.saved ? 'CheckCircle2' : 'Circle'} 
                        size={20} 
                        className={key.saved ? 'text-green-600' : 'text-gray-400'} />
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      {key.name}
                      {key.isFree && (
                        <Badge variant="secondary" className="text-xs">
                          <Icon name="Gift" size={12} className="mr-1" />
                          Бесплатно
                        </Badge>
                      )}
                      {key.saved && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Icon name="Check" size={12} className="mr-1" />
                          Подключен
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{key.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Возможности:</p>
                      <ul className="space-y-1">
                        {key.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => window.open(key.website, '_blank')}
                      >
                        <Icon name="ExternalLink" size={14} className="mr-1" />
                        Получить API ключ на {key.provider}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`key-${key.id}`}>API ключ</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`key-${key.id}`}
                          type={showKey[key.id] ? 'text' : 'password'}
                          placeholder={key.placeholder}
                          value={keys[key.id] || ''}
                          onChange={(e) => setKeys({ ...keys, [key.id]: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => toggleShowKey(key.id)}
                        >
                          <Icon name={showKey[key.id] ? 'EyeOff' : 'Eye'} size={16} />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleSaveKey(key.id)}
                        disabled={!keys[key.id]}
                      >
                        <Icon name="Save" size={16} className="mr-2" />
                        Сохранить
                      </Button>
                    </div>
                  </div>

                  {key.saved && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveKey(key.id)}
                    >
                      <Icon name="Trash2" size={14} className="mr-2" />
                      Удалить ключ
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <Icon name="Lightbulb" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-purple-900 mb-1">Совет по использованию</p>
              <p className="text-xs text-purple-800">
                Начните с Together AI или Replicate для генерации изображений, 
                и Groq или DeepSeek для текстовых ответов. Все сервисы бесплатны и не требуют карты.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
