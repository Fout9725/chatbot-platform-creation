import Icon from '@/components/ui/icon';

export const aiKeyframes = (
  <style>{`
    @keyframes aiGlowPulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50%      { transform: scale(1.25); opacity: 1; }
    }
    @keyframes aiOrbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes aiBob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes aiPing {
      0%   { transform: scale(0.8); opacity: 0.9; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  `}</style>
);

const Avatar3D = ({ size = 56 }: { size?: number }) => (
  <div
    className="relative"
    style={{ width: size, height: size, perspective: '600px' }}
  >
    <span
      className="absolute inset-0 rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)',
        filter: 'blur(8px)',
        animation: 'aiGlowPulse 2.4s ease-in-out infinite',
      }}
    />
    <span
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        border: '1px dashed rgba(168,85,247,0.6)',
        animation: 'aiOrbit 10s linear infinite',
      }}
    />
    <span
      className="absolute -inset-2 rounded-full pointer-events-none"
      style={{
        border: '1px dashed rgba(99,102,241,0.4)',
        animation: 'aiOrbit 14s linear infinite reverse',
      }}
    />
    <span
      className="relative z-10 flex items-center justify-center w-full h-full rounded-full"
      style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
        boxShadow:
          '0 12px 30px -8px rgba(168,85,247,0.7), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -4px 12px rgba(99,102,241,0.5)',
        animation: 'aiBob 3.5s ease-in-out infinite',
      }}
    >
      <Icon
        name="Bot"
        className="text-white"
        size={Math.round(size * 0.5)}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(168,85,247,0.8))' }}
      />
    </span>
  </div>
);

export default Avatar3D;
