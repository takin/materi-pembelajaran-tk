import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'

interface CameraControllerProps {
  targetPosition: THREE.Vector3 | null
  isTracking: boolean
  onComplete?: () => void
}

export function CameraController({
  targetPosition,
  isTracking,
  onComplete,
}: CameraControllerProps) {
  const { camera, controls } = useThree()
  const animating = useRef(false)
  const startPosition = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const progress = useRef(0)
  const lastTargetPosition = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    if (targetPosition && controls) {
      const orbitControls = controls as unknown as OrbitControlsType

      // Check if this is a new target (not just position update)
      // Use distance check instead of equals for better detection
      const isNewTarget =
        !lastTargetPosition.current ||
        lastTargetPosition.current.distanceTo(targetPosition) > 0.5

      if (isNewTarget) {
        // Store start positions
        startPosition.current.copy(camera.position)
        startTarget.current.copy(orbitControls.target)

        // Start animation
        animating.current = true
        progress.current = 0
      }

      lastTargetPosition.current = targetPosition.clone()
    } else if (!targetPosition) {
      // Reset when no target
      animating.current = false
      lastTargetPosition.current = null
    }
  }, [targetPosition, camera, controls])

  useFrame((state, delta) => {
    if (!targetPosition || !controls) return

    const orbitControls = controls as unknown as OrbitControlsType

    if (animating.current) {
      // Animate over 1 second
      progress.current += delta * 1.2

      if (progress.current >= 1) {
        progress.current = 1
        animating.current = false
        if (onComplete) onComplete()
      }

      // Smooth easing function
      const t = easeInOutCubic(progress.current)

      // Calculate new camera position (15 units away from planet)
      const offset = 15
      const angle = state.clock.getElapsedTime() * 0.1
      const targetCameraPos = new THREE.Vector3(
        targetPosition.x + Math.cos(angle) * offset,
        targetPosition.y + 8,
        targetPosition.z + Math.sin(angle) * offset,
      )

      // Interpolate camera position and target
      camera.position.lerpVectors(startPosition.current, targetCameraPos, t)
      orbitControls.target.lerpVectors(startTarget.current, targetPosition, t)

      orbitControls.update()
    } else if (isTracking) {
      // Continue tracking: update camera to follow planet movement
      // IMPORTANT: Always set target first to keep planet centered
      orbitControls.target.copy(targetPosition)

      // Calculate camera position orbiting around the planet
      const offset = 15
      const angle = state.clock.getElapsedTime() * 0.1
      const targetCameraPos = new THREE.Vector3(
        targetPosition.x + Math.cos(angle) * offset,
        targetPosition.y + 8,
        targetPosition.z + Math.sin(angle) * offset,
      )

      // More aggressive tracking - use higher lerp speed for better following
      const lerpSpeed = Math.min(delta * 8, 1)
      camera.position.lerp(targetCameraPos, lerpSpeed)

      // Force update to ensure target is applied
      orbitControls.update()
    }
  })

  return null
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
