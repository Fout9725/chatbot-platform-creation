import Icon from '@/components/ui/icon';

const steps = [
  {
    number: '1',
    icon: 'Store',
    title: 'Выберите решение',
    description: 'Найдите подходящего ИИ-бота в каталоге готовых решений для вашей задачи'
  },
  {
    number: '2',
    icon: 'PlayCircle',
    title: 'Попробуйте бесплатно',
    description: '3 дня тестирования без оплаты — убедитесь, что бот подходит вашему бизнесу'
  },
  {
    number: '3',
    icon: 'MessageCircle',
    title: 'Подключите к мессенджеру',
    description: 'Telegram, WhatsApp, VK — бот начнёт работать с вашими клиентами за 5 минут'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-12">
          Как это работает
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative mx-auto mb-5 w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Icon name={step.icon} size={28} className="text-violet-600" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
