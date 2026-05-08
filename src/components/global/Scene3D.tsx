import { CSSProperties } from 'react';

interface Scene3DProps {
  variant?: 'cube' | 'sphere' | 'pyramid' | 'rings';
  size?: number;
  className?: string;
  style?: CSSProperties;
}

// Намеренно отключено: убрали верхний слой 3D-визуала по запросу пользователя.
// Космический фон (CosmicBackground) и мягкие орбы (FloatingOrbs) сохранены.
// Компонент остаётся для обратной совместимости импортов в страницах.
const Scene3D = (_props: Scene3DProps) => null;

export default Scene3D;
