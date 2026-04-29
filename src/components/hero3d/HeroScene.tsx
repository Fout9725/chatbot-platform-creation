import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useState } from 'react';
import NeuralNetwork from './NeuralNetwork';
import Particles from './Particles';
import BackgroundDepth from './BackgroundDepth';

export default function HeroScene() {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  return (
    <Canvas
      camera={{ position: [0, 1.5, 8], fov: 50 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr([1, 2])}
        onDecline={() => setDpr([0.7, 1])}
      />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#3B82F6" />
      <pointLight position={[-5, -3, -2]} intensity={0.6} color="#8B5CF6" />

      <Suspense fallback={null}>
        <BackgroundDepth />
        <NeuralNetwork />

        <Particles count={3000} size={0.02} color="#ffffff" speed={0.06} spread={16} />
        <Particles count={250} size={0.07} color="#3B82F6" speed={0.18} spread={12} />

        <Grid
          args={[40, 40]}
          position={[0, -2.2, 0]}
          cellColor="#1E3A5F"
          sectionColor="#3B82F6"
          fadeDistance={18}
          fadeStrength={1.5}
          cellThickness={0.5}
          sectionThickness={1}
          infiniteGrid
        />

        <EffectComposer disableNormalPass>
          <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
