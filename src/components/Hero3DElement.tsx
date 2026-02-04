import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

// Dashboard card representing task/learning progress
const DashboardCard = ({ position, scale, color, delay = 0 }: { 
  position: [number, number, number]; 
  scale: number; 
  color: string;
  delay?: number;
}) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + delay) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={meshRef} position={position} scale={scale}>
        <RoundedBox args={[1.5, 1, 0.08]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        {/* Progress bar on card */}
        <mesh position={[0, -0.2, 0.05]}>
          <boxGeometry args={[1.2, 0.1, 0.02]} />
          <meshStandardMaterial color="#374151" roughness={0.5} />
        </mesh>
        <mesh position={[-0.15, -0.2, 0.06]}>
          <boxGeometry args={[0.9, 0.08, 0.02]} />
          <meshStandardMaterial color="#f97316" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>
    </Float>
  );
};

// Circular progress ring representing learning progress
const ProgressRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 0, 0]}>
        {/* Background ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.2, 0.08, 16, 64]} />
          <meshStandardMaterial
            color="#374151"
            roughness={0.4}
            metalness={0.2}
            transparent
            opacity={0.6}
          />
        </mesh>
        {/* Progress arc */}
        <mesh ref={progressRef} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[1.2, 0.1, 16, 32, Math.PI * 1.5]} />
          <meshStandardMaterial
            color="#f97316"
            roughness={0.2}
            metalness={0.8}
            emissive="#f97316"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Center percentage display */}
        <mesh>
          <circleGeometry args={[0.8, 32]} />
          <meshStandardMaterial
            color="#1f2937"
            roughness={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Floating checkmark representing completed tasks
const CheckMark = ({ position, scale }: { position: [number, number, number]; scale: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={groupRef} position={position} scale={scale}>
        {/* Circle background */}
        <mesh>
          <circleGeometry args={[0.4, 32]} />
          <meshStandardMaterial
            color="#22c55e"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        {/* Checkmark lines */}
        <mesh position={[-0.08, -0.02, 0.02]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.15, 0.06, 0.02]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 0.05, 0.02]} rotation={[0, 0, 0.8]}>
          <boxGeometry args={[0.25, 0.06, 0.02]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </Float>
  );
};

// Book/learning icon
const BookIcon = ({ position, scale }: { position: [number, number, number]; scale: number }) => {
  const bookRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (bookRef.current) {
      bookRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      bookRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={bookRef} position={position} scale={scale}>
        {/* Book cover */}
        <RoundedBox args={[0.7, 0.9, 0.12]} radius={0.02} smoothness={4}>
          <meshStandardMaterial
            color="#f97316"
            roughness={0.4}
            metalness={0.3}
          />
        </RoundedBox>
        {/* Book pages */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.6, 0.85, 0.08]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
        </mesh>
        {/* Book spine */}
        <mesh position={[-0.33, 0, 0]}>
          <boxGeometry args={[0.05, 0.9, 0.14]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    </Float>
  );
};

// Floating particles for ambiance
const ParticleField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 30;

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f97316"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

const Hero3DElement = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[600px] lg:h-[600px] pointer-events-none hidden lg:block">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.4} color="#f97316" />
          <pointLight position={[5, 5, 5]} intensity={0.3} color="#ffffff" />
          
          {/* Main progress ring */}
          <ProgressRing />
          
          {/* Dashboard cards */}
          <DashboardCard position={[-1.8, 1.2, -0.5]} scale={0.7} color="#ffffff" delay={0} />
          <DashboardCard position={[1.9, 0.8, -0.3]} scale={0.6} color="#f8fafc" delay={1} />
          <DashboardCard position={[-1.5, -1.3, -0.4]} scale={0.55} color="#ffffff" delay={2} />
          
          {/* Task completion checkmarks */}
          <CheckMark position={[2.2, -0.8, 0.2]} scale={0.8} />
          <CheckMark position={[-2.3, 0.3, 0.1]} scale={0.6} />
          
          {/* Book icon */}
          <BookIcon position={[1.5, -1.5, 0.3]} scale={0.7} />
          
          {/* Ambient particles */}
          <ParticleField />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DElement;
