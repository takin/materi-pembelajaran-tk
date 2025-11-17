import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  
  // Rotate the sun slowly
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <mesh ref={sunRef}>
      <sphereGeometry args={[5, 32, 32]} />
      <meshStandardMaterial 
        emissive="#FDB813"
        emissiveIntensity={1}
        color="#FDB813"
      />
      
      {/* Glow effect */}
      <pointLight intensity={2} distance={100} decay={2} />
    </mesh>
  );
}

