import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Position, GameConfig } from './types'

interface GoalMarkerProps {
  position: Position
  config: GameConfig
}

export function GoalMarker({ position, config }: GoalMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  // Convert grid position to world position
  const gridToWorld = (x: number, z: number) => {
    const { gridSize, tileSize } = config
    const worldX = (x - (gridSize - 1) / 2) * tileSize
    const worldZ = (z - (gridSize - 1) / 2) * tileSize
    return { x: worldX, z: worldZ }
  }

  const world = gridToWorld(position.x, position.z)

  // Animate: gentle bobbing and rotation
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const time = clock.getElapsedTime()
    meshRef.current.position.y = 0.3 + Math.sin(time * 2) * 0.1
    meshRef.current.rotation.y = time
  })

  return (
    <group position={[world.x, 0, world.z]}>
      {/* Star shape - using multiple triangles */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0, 0.3, 0.6, 5]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Glow effect */}
      <pointLight color="#FFD700" intensity={0.5} distance={2} />
    </group>
  )
}

