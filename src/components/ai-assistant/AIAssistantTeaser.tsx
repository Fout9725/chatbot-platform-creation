import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Avatar3D, { aiKeyframes } from './Avatar3D';

interface AIAssistantTeaserProps {
  mode: 'greeting' | 'closed' | 'minimized';
  messagesCount: number;
  onOpen: () => void;
  onDismiss: () => void;
  onExpand: () => void;
}

const AIAssistantTeaser = ({
  mode,
  messagesCount,
  onOpen,
  onDismiss,
  onExpand,
}: AIAssistantTeaserProps) => {
  if (mode === 'greeting') {
    return (
      <>
        {aiKeyframes}
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div
            className="w-80 rounded-2xl p-5 relative"
            style={{
              background:
                'linear-gradient(180deg, rgba(168,85,247,0.18) 0%, rgba(10,14,39,0.92) 100%)',
              border: '1px solid rgba(168,85,247,0.4)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 30px 80px -20px rgba(168,85,247,0.6)',
            }}
          >
            <button
              onClick={onDismiss}
              aria-label="Закрыть"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon name="X" size={14} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <Avatar3D size={52} />
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-white">
                  Привет! Нужна помощь?
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Расскажу про платформу и подскажу тариф
                </p>
              </div>
            </div>
            <Button
              onClick={onOpen}
              className="w-full h-10 text-white border-0"
              style={{
                background:
                  'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 8px 24px -6px rgba(168,85,247,0.7)',
              }}
            >
              <Icon name="Sparkles" size={15} className="mr-2" />
              Спросить помощника
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (mode === 'closed') {
    return (
      <>
        {aiKeyframes}
        <button
          onClick={onOpen}
          aria-label="Открыть ИИ-помощника"
          className="fixed bottom-6 right-6 z-50"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)',
              animation: 'aiPing 2.5s ease-out infinite',
            }}
          />
          <Avatar3D size={64} />
        </button>
      </>
    );
  }

  return (
    <>
      {aiKeyframes}
      <button
        onClick={onExpand}
        aria-label="Развернуть помощника"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-2 pr-4 h-14 rounded-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.25) 100%)',
          border: '1px solid rgba(168,85,247,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px -16px rgba(168,85,247,0.7)',
        }}
      >
        <Avatar3D size={40} />
        <span className="text-sm font-semibold text-white">Помощник</span>
        {messagesCount > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 12px rgba(34,197,94,0.7)',
            }}
          >
            {messagesCount}
          </span>
        )}
      </button>
    </>
  );
};

export default AIAssistantTeaser;
