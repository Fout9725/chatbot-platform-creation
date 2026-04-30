import { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'accent';
  style?: CSSProperties;
}

const variantStyles: Record<string, CSSProperties> = {
  default: {
    background:
      'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, rgba(10,14,39,0.85) 100%)',
    border: '1px solid rgba(99,102,241,0.4)',
  },
  subtle: {
    background:
      'linear-gradient(180deg, rgba(30,41,82,0.55) 0%, rgba(10,14,39,0.75) 100%)',
    border: '1px solid rgba(99,102,241,0.18)',
  },
  accent: {
    background:
      'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.10) 100%)',
    border: '1px solid rgba(139,92,246,0.45)',
  },
};

const GlassCard = ({
  children,
  className,
  variant = 'default',
  style,
  ...props
}: GlassCardProps) => {
  return (
    <div
      className={cn('rounded-2xl backdrop-blur-2xl shadow-2xl', className)}
      style={{
        ...variantStyles[variant],
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow:
          '0 20px 60px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
