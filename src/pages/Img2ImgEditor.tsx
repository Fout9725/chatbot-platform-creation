import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getImg2ImgModels } from '@/config/aiModels';
import funcUrls from '../../backend/func2url.json';

const IMG2IMG_URL = funcUrls['img2img-generate'];

const models = getImg2ImgModels();

const Img2ImgEditor = () => {
  const [selectedModel, setSelectedModel] = useState(models[0]?.id || '');
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Ошибка', description: 'Выберите файл изображения', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Ошибка', description: 'Максимальный размер — 10 МБ', variant: 'destructive' });
      return;
    }
    setSourceFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
      setResultImage(null);
      setStatus('idle');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!sourceImage || !prompt || !selectedModel) return;

    setStatus('loading');
    setErrorText('');
    setResultImage(null);

    const base64Data = sourceImage.includes(',') ? sourceImage : `data:image/jpeg;base64,${sourceImage}`;

    const resp = await fetch(IMG2IMG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        image_base64: base64Data,
      }),
    });

    const data = await resp.json();

    if (!resp.ok || !data.success) {
      setStatus('error');
      setErrorText(data.error || 'Неизвестная ошибка');
      toast({ title: 'Ошибка генерации', description: data.error || 'Попробуйте другую модель', variant: 'destructive' });
      return;
    }

    setResultImage(data.image);
    setStatus('success');
    toast({ title: 'Готово!', description: 'Изображение успешно отредактировано' });
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    if (resultImage.startsWith('data:')) {
      link.href = resultImage;
    } else {
      link.href = resultImage;
      link.target = '_blank';
    }
    link.download = `img2img-${Date.now()}.png`;
    link.click();
  };

  const promptExamples = [
    'Сделай фон осенним с жёлтыми листьями',
    'Преврати фото в акварельную живопись',
    'Добавь солнечные лучи на фото',
    'Замени одежду на деловой костюм',
    'Сделай фото в стиле аниме',
    'Убери фон и оставь только объект',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(120,80,255,0.08)_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,100,80,0.06)_0%,_transparent_50%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
              <Icon name="Wand2" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Img2Img Редактор
              </h1>
              <p className="text-sm text-zinc-500">Редактирование фото с помощью AI моделей</p>
            </div>
          </div>
          <a href="/" className="text-zinc-500 hover:text-white transition-colors text-sm flex items-center gap-1">
            <Icon name="ArrowLeft" size={16} />
            На главную
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 ${
                  dragOver
                    ? 'border-violet-500 bg-violet-500/10'
                    : sourceImage
                    ? 'border-zinc-700 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                }`}
              >
                {sourceImage ? (
                  <>
                    <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-xs text-zinc-400 truncate">{sourceFileName}</p>
                      <p className="text-[10px] text-zinc-600">Нажмите для замены</p>
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-medium text-violet-400 uppercase tracking-wider">
                      Оригинал
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Icon name="ImagePlus" size={28} className="text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-400">Загрузите изображение</p>
                      <p className="text-xs text-zinc-600 mt-1">Перетащите или нажмите для выбора</p>
                      <p className="text-[10px] text-zinc-700 mt-2">JPG, PNG, WebP до 10 МБ</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <div className="relative aspect-square rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 overflow-hidden">
                {resultImage ? (
                  <>
                    <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                      Результат
                    </div>
                    <button
                      onClick={handleDownload}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <Icon name="Download" size={16} className="text-white" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {status === 'loading' ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Icon name="Loader2" size={28} className="text-violet-400 animate-spin" />
                        </div>
                        <p className="text-sm text-zinc-500">Генерация...</p>
                        <p className="text-[10px] text-zinc-700">Обычно занимает 15-60 секунд</p>
                      </>
                    ) : status === 'error' ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
                          <Icon name="AlertTriangle" size={28} className="text-red-400" />
                        </div>
                        <p className="text-sm text-red-400 text-center px-4">{errorText}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Icon name="Sparkles" size={28} className="text-zinc-600" />
                        </div>
                        <p className="text-sm text-zinc-600">Здесь появится результат</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите, что нужно изменить на фото..."
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[100px] rounded-xl resize-none focus:border-violet-500/50 focus:ring-violet-500/20"
            />

            <div className="flex flex-wrap gap-2">
              {promptExamples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-violet-500/40 transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!sourceImage || !prompt || !selectedModel || status === 'loading'}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Icon name="Wand2" size={18} className="mr-2" />
                  Редактировать изображение
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Icon name="Cpu" size={16} className="text-violet-400" />
                Модель
              </h3>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                      selectedModel === model.id
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{model.name}</span>
                      {selectedModel === model.id && (
                        <div className="w-2 h-2 rounded-full bg-violet-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-zinc-500" />
                Как это работает
              </h3>
              <ol className="space-y-2 text-xs text-zinc-500">
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold">1.</span>
                  Загрузите исходное изображение
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold">2.</span>
                  Опишите, что нужно изменить
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold">3.</span>
                  Выберите AI модель
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold">4.</span>
                  Нажмите «Редактировать» и получите результат
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-violet-600/10 to-orange-500/10 border border-violet-500/20 rounded-2xl p-5">
              <p className="text-xs text-zinc-400">
                Powered by <span className="text-violet-400 font-medium">VseGPT</span> — 6 моделей для редактирования изображений с помощью текстовых описаний.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Img2ImgEditor;
