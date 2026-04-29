import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BackgroundDepth() {
  const t1 = useRef<THREE.Mesh>(null);
  const t2 = useRef<THREE.Mesh>(null);
  const t3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (t1.current) { t1.current.rotation.x += delta * 0.05; t1.current.rotation.y += delta * 0.03; }
    if (t2.current) { t2.current.rotation.x -= delta * 0.04; t2.current.rotation.z += delta * 0.05; }
    if (t3.current) { t3.current.rotation.y += delta * 0.02; t3.current.rotation.z -= delta * 0.03; }
  });

  return (
    <group>
      <mesh ref={t1} position={[-3, 0.5, -4]}>
        <torusGeometry args={[1.8, 0.05, 12, 80]} />
        <meshStandardMaterial color="#8B5CF6" transparent opacity={0.15} toneMapped={false} />
      </mesh>
      <mesh ref={t2} position={[3, -0.3, -5]}>
        <torusGeometry args={[2.2, 0.04, 12, 80]} />
        <meshStandardMaterial color="#3B82F6" transparent opacity={0.12} toneMapped={false} />
      </mesh>
      <mesh ref={t3} position={[0, 1.2, -6]}>
        <torusGeometry args={[2.8, 0.05, 12, 80]} />
        <meshStandardMaterial color="#8B5CF6" transparent opacity={0.1} toneMapped={false} />
      </mesh>
    </group>
  );
}
