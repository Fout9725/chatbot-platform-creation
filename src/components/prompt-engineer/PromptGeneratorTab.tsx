import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { MODELS, PROMPT_API } from './constants';

interface PromptGeneratorTabProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const PromptGeneratorTab = ({ selectedModel, setSelectedModel }: PromptGeneratorTabProps) => {
  const [userRequest, setUserRequest] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
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
    } catch {
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

  return (
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
  );
};

export default PromptGeneratorTab;
