import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'

interface CameraControllerProps {
  targetPosition: THREE.Vector3 | null
  onComplete?: () => void
}

export function CameraController({
  targetPosition,
  onComplete,
}: CameraControllerProps) {
  const { camera, controls } = useThree()
  const animating = useRef(false)
  const startPosition = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const progress = useRef(0)

  useEffect(() => {
    if (targetPosition && controls) {
      const orbitControls = controls as unknown as OrbitControlsType

      // Store start positions
      startPosition.current.copy(camera.position)
      startTarget.current.copy(orbitControls.target)

      // Calculate camera position (offset from planet)
      // const direction = new THREE.Vector3()
      //   .subVectors(camera.position, orbitControls.target)
      //   .normalize();

      // Start animation
      animating.current = true
      progress.current = 0
    }
  }, [targetPosition, camera, controls])

  useFrame((state, delta) => {
    if (animating.current && targetPosition && controls) {
      const orbitControls = controls as unknown as OrbitControlsType

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
    }
  })

  return null
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
