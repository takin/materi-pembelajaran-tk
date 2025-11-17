import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface PlanetTrackerProps {
  planetName: string | null
  orbitRadius: number
  orbitSpeed: number
  speedScale: number
  onPositionUpdate: (position: THREE.Vector3) => void
}

export function PlanetTracker({
  planetName,
  orbitRadius,
  orbitSpeed,
  speedScale,
  onPositionUpdate,
}: PlanetTrackerProps) {
  const { clock } = useThree()
  const lastPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const initialized = useRef(false)

  // Calculate initial position immediately when component mounts or planet changes
  useEffect(() => {
    if (!planetName) {
      initialized.current = false
      return
    }

    const time = clock.getElapsedTime()
    const angle = time * orbitSpeed * 0.1 * speedScale

    const initialPosition = new THREE.Vector3(
      Math.cos(angle) * orbitRadius,
      0,
      Math.sin(angle) * orbitRadius,
    )

    lastPosition.current.copy(initialPosition)
    onPositionUpdate(initialPosition)
    initialized.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetName, orbitRadius, orbitSpeed, speedScale])

  useFrame((state) => {
    if (!planetName || !initialized.current) return

    // Calculate current planet position based on orbit
    // Use the EXACT same calculation as Planet component
    const time = state.clock.getElapsedTime()
    const angle = time * orbitSpeed * 0.1 * speedScale

    const currentPosition = new THREE.Vector3(
      Math.cos(angle) * orbitRadius,
      0,
      Math.sin(angle) * orbitRadius,
    )

    // Always update position to ensure smooth tracking
    // Update every frame for continuous tracking
    lastPosition.current.copy(currentPosition)
    onPositionUpdate(currentPosition)
  })

  return null
}

