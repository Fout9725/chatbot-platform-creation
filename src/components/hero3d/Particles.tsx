import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  count: number;
  size: number;
  color: string;
  speed: number;
  spread?: number;
};

export default function Particles({ count, size, color, speed, spread = 14 }: Props) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count, spread]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const half = spread / 2;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speed;
      if (arr[i * 3 + 1] > half) arr[i * 3 + 1] = -half;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
