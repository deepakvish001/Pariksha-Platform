import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import { useRef, Suspense, useMemo } from 'react';
import * as THREE from 'three';

// AI Brain Core - geometric crystalline structure
const AICore = () => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
    if (innerRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      innerRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Outer crystalline shell */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshPhysicalMaterial
            color="#1a1a2e"
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Inner glowing core */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>

        {/* Core wireframe */}
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <octahedronGeometry args={[0.85, 0]} />
          <meshBasicMaterial
            color="#f97316"
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Floating code bracket
const CodeBracket = ({ 
  position, 
  rotation, 
  scale = 1,
  isOpen = true 
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number];
  scale?: number;
  isOpen?: boolean;
}) => {
  const bracketRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (bracketRef.current) {
      bracketRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.08;
    }
  });

  const bracketChar = isOpen ? '<' : '/>';

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={bracketRef} position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[0.5, 0.7, 0.08]} radius={0.02} smoothness={4}>
          <meshPhysicalMaterial
            color="#0a0a0f"
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </RoundedBox>
        {/* Bracket glow edge */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.4, 0.55]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Neural connection line
const NeuralConnection = ({ 
  start, 
  end, 
  delay = 0 
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
  delay?: number;
}) => {
  const pulseRef = useRef<THREE.Mesh>(null);

  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 0.5,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(20);
  }, [start, end]);

  useFrame((state) => {
    if (pulseRef.current) {
      const t = ((state.clock.elapsedTime + delay) % 2) / 2;
      const point = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2 + 0.5,
          (start[2] + end[2]) / 2
        ),
        new THREE.Vector3(...end)
      ).getPoint(t);
      pulseRef.current.position.copy(point);
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ 
    color: '#f97316', 
    transparent: true, 
    opacity: 0.3 
  }), []);

  return (
    <group>
      <primitive object={new THREE.Line(geometry, lineMaterial)} />
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// Floating terminal window
const TerminalWindow = ({ 
  position, 
  scale = 1 
}: { 
  position: [number, number, number]; 
  scale?: number;
}) => {
  const windowRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (windowRef.current) {
      windowRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      windowRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group ref={windowRef} position={position} scale={scale}>
        {/* Window frame */}
        <RoundedBox args={[1.4, 1, 0.06]} radius={0.04} smoothness={4}>
          <meshPhysicalMaterial
            color="#0f0f1a"
            metalness={0.7}
            roughness={0.3}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        
        {/* Title bar */}
        <mesh position={[0, 0.4, 0.035]}>
          <planeGeometry args={[1.3, 0.12]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        
        {/* Window buttons */}
        {[-0.5, -0.4, -0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.4, 0.04]}>
            <circleGeometry args={[0.03, 16]} />
            <meshStandardMaterial
              color={['#ff5f56', '#ffbd2e', '#27ca40'][i]}
              emissive={['#ff5f56', '#ffbd2e', '#27ca40'][i]}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
        
        {/* Code lines */}
        {[0.2, 0.05, -0.1, -0.25].map((y, i) => (
          <mesh key={i} position={[-0.2 + i * 0.05, y, 0.035]}>
            <planeGeometry args={[0.6 + Math.random() * 0.4, 0.06]} />
            <meshStandardMaterial
              color={i === 1 ? '#f97316' : '#3b3b5c'}
              emissive={i === 1 ? '#f97316' : '#000000'}
              emissiveIntensity={i === 1 ? 0.3 : 0}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
};

// AI Chip/Processor
const AIChip = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => {
  const chipRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (chipRef.current) {
      chipRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={chipRef} position={position} scale={scale}>
        {/* Chip body */}
        <RoundedBox args={[0.6, 0.6, 0.1]} radius={0.03} smoothness={4}>
          <meshPhysicalMaterial
            color="#0a0a12"
            metalness={0.9}
            roughness={0.2}
          />
        </RoundedBox>
        
        {/* Center glow */}
        <mesh position={[0, 0, 0.06]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
        
        {/* Circuit traces */}
        {[
          { pos: [0.2, 0, 0.06], size: [0.15, 0.02] },
          { pos: [-0.2, 0, 0.06], size: [0.15, 0.02] },
          { pos: [0, 0.2, 0.06], size: [0.02, 0.15] },
          { pos: [0, -0.2, 0.06], size: [0.02, 0.15] },
        ].map((trace, i) => (
          <mesh key={i} position={trace.pos as [number, number, number]}>
            <planeGeometry args={trace.size as [number, number]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#f97316"
              emissiveIntensity={0.8}
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>
        ))}
        
        {/* Connection pins */}
        {[-0.35, 0.35].map((x) =>
          [-0.15, 0, 0.15].map((y, i) => (
            <mesh key={`${x}-${i}`} position={[x, y, 0]}>
              <boxGeometry args={[0.08, 0.04, 0.08]} />
              <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.3} />
            </mesh>
          ))
        )}
      </group>
    </Float>
  );
};

// Ambient particles
const TechParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 35;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2 + Math.random() * 2.5;
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
        size={0.03}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

const Hero3DElement = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[620px] lg:h-[620px] pointer-events-none hidden lg:block">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-3, 3, 3]} intensity={0.8} color="#f97316" />
          <pointLight position={[3, -3, 2]} intensity={0.5} color="#fb923c" />
          
          {/* Main AI Core */}
          <AICore />
          
          {/* Floating elements */}
          <TerminalWindow position={[-1.8, 0.8, -0.5]} scale={0.75} />
          <AIChip position={[1.9, -0.9, 0]} scale={0.9} />
          
          {/* Code brackets */}
          <CodeBracket position={[-2, -0.8, 0.3]} rotation={[0, 0.3, 0.1]} scale={0.7} isOpen={true} />
          <CodeBracket position={[2.1, 0.6, 0.2]} rotation={[0, -0.2, -0.1]} scale={0.6} isOpen={false} />
          
          {/* Neural connections */}
          <NeuralConnection start={[0, 0, 0]} end={[-1.8, 0.8, -0.5]} delay={0} />
          <NeuralConnection start={[0, 0, 0]} end={[1.9, -0.9, 0]} delay={0.7} />
          <NeuralConnection start={[0, 0, 0]} end={[-2, -0.8, 0.3]} delay={1.4} />
          <NeuralConnection start={[0, 0, 0]} end={[2.1, 0.6, 0.2]} delay={0.3} />
          
          {/* Ambient particles */}
          <TechParticles />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DElement;
