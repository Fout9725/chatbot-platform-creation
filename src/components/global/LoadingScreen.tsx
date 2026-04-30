import GlassCard from './GlassCard';
import Scene3D from './Scene3D';

interface LoadingScreenProps {
  text?: string;
  fullscreen?: boolean;
}

const LoadingScreen = ({
  text = 'Загрузка...',
  fullscreen = true,
}: LoadingScreenProps) => {
  return (
    <div
      className={`flex items-center justify-center px-4 ${
        fullscreen ? 'min-h-screen' : 'min-h-[400px]'
      }`}
    >
      <GlassCard className="px-8 py-10 md:px-14 md:py-12 flex flex-col items-center gap-6 glass-fade-in">
        <Scene3D variant="rings" size={140} />
        <div className="text-center">
          <div
            className="text-lg md:text-xl font-semibold text-glass-title"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {text}
          </div>
          <div className="mt-3 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, #818cf8, #c084fc)',
                  animation: `loadDot 1.2s ${i * 0.15}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes loadDot {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-4px); }
          }
        `}</style>
      </GlassCard>
    </div>
  );
};

export default LoadingScreen;
