import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RobotState, GameConfig } from './types'

interface RobotProps {
  state: RobotState
  config: GameConfig
  isAnimating: boolean
}

export function Robot({ state, config, isAnimating }: RobotProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetPosition = useRef(new THREE.Vector3())
  const targetRotation = useRef(0)

  // Convert grid position to world position
  const gridToWorld = (x: number, z: number) => {
    const { gridSize, tileSize } = config
    const worldX = (x - (gridSize - 1) / 2) * tileSize
    const worldZ = (z - (gridSize - 1) / 2) * tileSize
    return { x: worldX, z: worldZ }
  }

  // Update target position/rotation when state changes
  useEffect(() => {
    const world = gridToWorld(state.position.x, state.position.z)
    targetPosition.current.set(world.x, 0.3, world.z)
    targetRotation.current = THREE.MathUtils.degToRad(-state.rotation)
  }, [state])

  // Smooth animation
  useFrame(() => {
    if (!groupRef.current) return

    // Smooth position
    groupRef.current.position.lerp(targetPosition.current, 0.1)

    // Smooth rotation
    const currentRot = groupRef.current.rotation.y
    const diff = targetRotation.current - currentRot
    // Handle wrap-around for rotation
    const shortestDiff =
      ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) -
      Math.PI
    groupRef.current.rotation.y += shortestDiff * 0.1
  })

  return (
    <group ref={groupRef}>
      {/* Robot body - a cute box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>

      {/* Robot head */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
        <meshStandardMaterial color="#5FA3E8" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 0.4, 0.15]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.1, 0.4, 0.15]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Direction indicator (nose/arrow) */}
      <mesh position={[0, 0.3, 0.2]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
    </group>
  )
}

