import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const FEATURES = [
  { icon: 'Radar', title: 'Опрос ChatGPT и Perplexity', text: 'Каждый день проверяем, что нейросети говорят о вашем бренде' },
  { icon: 'PieChart', title: 'Доля голоса (SOV)', text: 'Сравниваем вас с конкурентами в ответах LLM' },
  { icon: 'Sparkles', title: 'Контент под GEO', text: 'Генерируем статьи, чтобы попасть в выдачу нейросетей' },
];

export default function GeoPromo() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium text-indigo-700 mb-5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Новый продукт платформы
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              GEO Factory: следите, как нейросети{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                упоминают ваш бренд
              </span>
            </h2>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Пока SEO борется за первую страницу Google, ваши клиенты уже спрашивают ChatGPT и Perplexity.
              Мы измеряем долю упоминаний и помогаем попасть в их ответы.
            </p>

            <div className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Icon name={f.icon} size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{f.title}</div>
                    <div className="text-sm text-gray-500">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/geo/register')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 px-7"
              >
                <Icon name="Rocket" size={18} className="mr-2" />
                Начать бесплатно
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/geo/login')}
                className="border-indigo-200 hover:bg-white"
              >
                Войти в кабинет
              </Button>
            </div>

            <div className="flex items-center gap-5 mt-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Icon name="Check" size={14} className="text-emerald-500" />
                Без карты
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="Check" size={14} className="text-emerald-500" />
                Готов за 5 минут
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="Check" size={14} className="text-emerald-500" />
                ChatGPT + Perplexity
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/40 border border-gray-100 p-6 relative z-10">
              <div className="flex items-center justify-between mb-5 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Icon name="Sparkles" size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">GEO Dashboard</div>
                    <div className="text-xs text-gray-400">за последние 7 дней</div>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">+24%</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <div className="text-xs text-indigo-600 mb-1">Доля голоса</div>
                  <div className="text-2xl font-bold text-gray-900">34.2%</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="text-xs text-emerald-600 mb-1">Упоминаний</div>
                  <div className="text-2xl font-bold text-gray-900">128</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Ваш бренд', val: 34, color: 'bg-indigo-500', own: true },
                  { name: 'Конкурент A', val: 28, color: 'bg-slate-400' },
                  { name: 'Конкурент B', val: 22, color: 'bg-slate-400' },
                  { name: 'Конкурент C', val: 16, color: 'bg-slate-400' },
                ].map((b) => (
                  <div key={b.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={b.own ? 'font-semibold text-indigo-700' : 'text-gray-600'}>
                        {b.name} {b.own && '★'}
                      </span>
                      <span className="text-gray-500 tabular-nums">{b.val}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.val * 2.5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20 hidden sm:block">
              <div className="flex items-center gap-2 text-xs">
                <Icon name="MessageSquare" size={14} className="text-purple-500" />
                <span className="font-medium">ChatGPT упомянул вас</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20 hidden sm:block">
              <div className="flex items-center gap-2 text-xs">
                <Icon name="TrendingUp" size={14} className="text-emerald-500" />
                <span className="font-medium">+12 упоминаний за неделю</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
