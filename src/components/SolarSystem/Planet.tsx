import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface PlanetProps {
  name: string;
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  speedScale: number;
  hasRings?: boolean;
  onClick?: (name: string, position: THREE.Vector3) => void;
}

export function Planet({
  name,
  size,
  color,
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  speedScale,
  hasRings = false,
  onClick,
}: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  
  // Create orbit path points
  const orbitPoints: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    orbitPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      )
    );
  }
  
  // Animation
  useFrame((state) => {
    if (orbitRef.current && planetRef.current) {
      // Orbit around the sun
      const time = state.clock.getElapsedTime();
      const angle = time * orbitSpeed * 0.1 * speedScale;
      
      orbitRef.current.position.x = Math.cos(angle) * orbitRadius;
      orbitRef.current.position.z = Math.sin(angle) * orbitRadius;
      
      // Rotate the planet on its axis
      planetRef.current.rotation.y += rotationSpeed * 0.01 * speedScale;
    }
  });
  
  return (
    <>
      {/* Orbit path */}
      <Line
        points={orbitPoints}
        color="white"
        lineWidth={0.5}
        opacity={0.3}
        transparent
      />
      
      {/* Planet group (for orbit position) */}
      <group ref={orbitRef}>
        {/* Planet */}
        <mesh 
          ref={planetRef}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick && orbitRef.current) {
              const worldPosition = new THREE.Vector3();
              orbitRef.current.getWorldPosition(worldPosition);
              onClick(name, worldPosition);
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        
        {/* Saturn's rings */}
        {hasRings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[size * 1.5, size * 2.5, 64]} />
            <meshStandardMaterial
              color="#C9B591"
              side={THREE.DoubleSide}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </group>
    </>
  );
}

