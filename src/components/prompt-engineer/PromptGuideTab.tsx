import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface PromptGuideTabProps {
  onSwitchToGenerator: () => void;
}

const COSTAR_ITEMS = [
  { letter: 'C', word: 'Context', desc: 'Контекст — опишите ситуацию и предысторию' },
  { letter: 'O', word: 'Objective', desc: 'Цель — что конкретно нужно получить' },
  { letter: 'S', word: 'Steps', desc: 'Шаги — пошаговая инструкция выполнения' },
  { letter: 'T', word: 'Tone', desc: 'Тон — стиль и подача (формальный, дружелюбный)' },
  { letter: 'A', word: 'Audience', desc: 'Аудитория — для кого предназначен результат' },
  { letter: 'R', word: 'Response', desc: 'Формат ответа — таблица, список, JSON и др.' }
];

const TECHNIQUES = [
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
];

const PromptGuideTab = ({ onSwitchToGenerator }: PromptGuideTabProps) => {
  return (
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
            {COSTAR_ITEMS.map(item => (
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
            {TECHNIQUES.map(item => (
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
            onClick={onSwitchToGenerator}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
          >
            <Icon name="Sparkles" size={16} className="mr-2" />
            Перейти к генератору
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptGuideTab;
