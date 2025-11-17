import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SunProps {
  onClick?: (name: string, position: THREE.Vector3) => void
}

export function Sun({ onClick }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null)

  // Rotate the sun slowly
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh
      ref={sunRef}
      onClick={(e) => {
        e.stopPropagation()
        if (onClick && sunRef.current) {
          const worldPosition = new THREE.Vector3()
          sunRef.current.getWorldPosition(worldPosition)
          onClick('Sun', worldPosition)
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[5, 32, 32]} />
      <meshStandardMaterial
        emissive="#FDB813"
        emissiveIntensity={1}
        color="#FDB813"
      />

      {/* Glow effect */}
      <pointLight intensity={2} distance={100} decay={2} />
    </mesh>
  )
}
