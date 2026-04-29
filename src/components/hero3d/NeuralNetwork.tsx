import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT = 90;
const RING_COUNT = 5;

type NodeData = {
  basePos: THREE.Vector3;
  phase: number;
  amp: number;
};

function buildNodes(): NodeData[] {
  const nodes: NodeData[] = [];
  for (let r = 0; r < RING_COUNT; r++) {
    const ringNodes = Math.floor(NODE_COUNT / RING_COUNT);
    const radius = 1.4 + r * 0.55;
    const yOffset = (r - (RING_COUNT - 1) / 2) * 0.7;
    for (let i = 0; i < ringNodes; i++) {
      const angle = (i / ringNodes) * Math.PI * 2 + r * 0.3;
      nodes.push({
        basePos: new THREE.Vector3(
          Math.cos(angle) * radius,
          yOffset + (Math.random() - 0.5) * 0.4,
          Math.sin(angle) * radius,
        ),
        phase: Math.random() * Math.PI * 2,
        amp: 0.15 + Math.random() * 0.2,
      });
    }
  }
  return nodes;
}

function buildEdges(nodes: NodeData[]): [number, number][] {
  const edges: [number, number][] = [];
  const maxDist = 1.4;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
      if (d < maxDist && Math.random() < 0.55) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

export default function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const { mouse } = useThree();

  const nodes = useMemo(() => buildNodes(), []);
  const edges = useMemo(() => buildEdges(nodes), [nodes]);

  const linePositions = useMemo(() => new Float32Array(edges.length * 6), [edges.length]);
  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      const targetY = mouse.x * 0.5;
      const targetX = -mouse.y * 0.3;
      groupRef.current.rotation.y += (targetY + t * 0.1 - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.04;
    }

    if (meshRef.current) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const y = n.basePos.y + Math.sin(t * 0.8 + n.phase) * n.amp;
        dummy.position.set(n.basePos.x, y, n.basePos.z);
        dummy.scale.setScalar(0.9 + Math.sin(t * 1.2 + n.phase) * 0.15);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lineRef.current) {
      const arr = linePositions;
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e];
        const na = nodes[a];
        const nb = nodes[b];
        const ya = na.basePos.y + Math.sin(t * 0.8 + na.phase) * na.amp;
        const yb = nb.basePos.y + Math.sin(t * 0.8 + nb.phase) * nb.amp;
        arr[e * 6 + 0] = na.basePos.x;
        arr[e * 6 + 1] = ya;
        arr[e * 6 + 2] = na.basePos.z;
        arr[e * 6 + 3] = nb.basePos.x;
        arr[e * 6 + 4] = yb;
        arr[e * 6 + 5] = nb.basePos.z;
        void tmpVec;
      }
      lineGeom.attributes.position.needsUpdate = true;
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#3B82F6"
          emissive="#3B82F6"
          emissiveIntensity={1.2}
          metalness={0.3}
          roughness={0.2}
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments ref={lineRef} geometry={lineGeom}>
        <lineBasicMaterial color="#8B5CF6" transparent opacity={0.5} toneMapped={false} />
      </lineSegments>
    </group>
  );
}
