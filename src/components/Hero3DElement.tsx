import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { useRef, Suspense, useMemo } from 'react';
import * as THREE from 'three';

// Premium glass-like morphing core sphere
const GlassCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={1.4}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshTransmissionMaterial
          ref={materialRef}
          backside
          samples={16}
          resolution={512}
          transmission={0.95}
          roughness={0.05}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.15}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#ff6b35"
        />
      </mesh>
    </Float>
  );
};

// Inner glowing energy core
const EnergyCore = () => {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (coreRef.current) {
      const scale = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      coreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#f97316"
        emissive="#f97316"
        emissiveIntensity={2}
        toneMapped={false}
      />
    </mesh>
  );
};

// Orbiting ring with glow
const OrbitRing = ({ 
  radius, 
  speed, 
  rotationAxis, 
  thickness = 0.03,
  color = "#f97316"
}: { 
  radius: number; 
  speed: number; 
  rotationAxis: [number, number, number];
  thickness?: number;
  color?: string;
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = rotationAxis[0] + state.clock.elapsedTime * speed;
      ringRef.current.rotation.y = rotationAxis[1] + state.clock.elapsedTime * speed * 0.7;
      ringRef.current.rotation.z = rotationAxis[2];
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.9}
        toneMapped={false}
      />
    </mesh>
  );
};

// Orbiting energy particles
const OrbitingParticle = ({ 
  radius, 
  speed, 
  offset,
  size = 0.08
}: { 
  radius: number; 
  speed: number; 
  offset: number;
  size?: number;
}) => {
  const particleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (particleRef.current) {
      const angle = state.clock.elapsedTime * speed + offset;
      particleRef.current.position.x = Math.cos(angle) * radius;
      particleRef.current.position.z = Math.sin(angle) * radius;
      particleRef.current.position.y = Math.sin(angle * 2) * 0.3;
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color="#ff8c42"
        emissive="#f97316"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </mesh>
  );
};

// Floating data streams/lines
const DataStream = ({ 
  startPos, 
  angle,
  length = 1.5
}: { 
  startPos: [number, number, number]; 
  angle: number;
  length?: number;
}) => {
  const streamRef = useRef<THREE.Group>(null);
  
  const segments = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      offset: i * 0.3,
      size: 0.04 - i * 0.005,
    }));
  }, []);

  useFrame((state) => {
    if (streamRef.current) {
      streamRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={streamRef} position={startPos} rotation={[0, angle, 0]}>
      {segments.map((seg, i) => (
        <mesh key={i} position={[seg.offset * length, 0, 0]}>
          <sphereGeometry args={[seg.size, 8, 8]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={1 - i * 0.15}
            transparent
            opacity={1 - i * 0.15}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Ambient floating particles
const AmbientParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
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
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

const Hero3DElement = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[650px] lg:h-[650px] pointer-events-none hidden lg:block">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          {/* Lighting setup */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-5, 5, 5]} intensity={1} color="#f97316" />
          <pointLight position={[5, -5, -5]} intensity={0.5} color="#ff6b35" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.5}
            penumbra={1}
            intensity={1}
            color="#fff7ed"
          />
          
          {/* Environment for reflections */}
          <Environment preset="city" />
          
          {/* Main glass core */}
          <GlassCore />
          
          {/* Inner energy core */}
          <EnergyCore />
          
          {/* Orbiting rings */}
          <OrbitRing radius={1.8} speed={0.3} rotationAxis={[0.5, 0, 0]} thickness={0.025} color="#f97316" />
          <OrbitRing radius={2.2} speed={-0.2} rotationAxis={[0.8, 0.3, 0.2]} thickness={0.02} color="#fb923c" />
          <OrbitRing radius={2.5} speed={0.15} rotationAxis={[-0.3, 0.6, 0.1]} thickness={0.015} color="#fdba74" />
          
          {/* Orbiting particles */}
          <OrbitingParticle radius={1.9} speed={0.8} offset={0} size={0.07} />
          <OrbitingParticle radius={2.3} speed={-0.6} offset={2} size={0.05} />
          <OrbitingParticle radius={2.6} speed={0.4} offset={4} size={0.06} />
          
          {/* Data streams */}
          <DataStream startPos={[1.5, 0.5, 0]} angle={0.3} />
          <DataStream startPos={[-1.2, -0.3, 0.8]} angle={2.5} />
          <DataStream startPos={[0.5, -0.8, -1]} angle={4.2} />
          
          {/* Ambient particles */}
          <AmbientParticles />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DElement;
