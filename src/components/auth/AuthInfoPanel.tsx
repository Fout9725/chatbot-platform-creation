import Icon from '@/components/ui/icon';
import SecurityShield from './SecurityShield';

const AuthInfoPanel = () => {
  return (
    <div className="hidden lg:block">
      <SecurityShield />

      <div className="mt-6 space-y-3 max-w-md mx-auto">
        {[
          {
            icon: 'Lock',
            title: 'TLS 1.3 шифрование',
            desc: 'Все данные передаются по защищённому каналу',
          },
          {
            icon: 'Database',
            title: 'Хранение в России',
            desc: 'Соответствие 152-ФЗ, серверы в РФ',
          },
          {
            icon: 'KeyRound',
            title: 'Хеширование паролей',
            desc: 'Пароли хранятся в виде SHA-256 хешей',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 100%)',
                border: '1px solid rgba(16,185,129,0.5)',
              }}
            >
              <Icon
                name={item.icon}
                size={16}
                className="text-emerald-300"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">
                {item.title}
              </div>
              <div className="text-xs text-slate-400">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthInfoPanel;
