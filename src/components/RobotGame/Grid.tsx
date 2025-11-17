import * as THREE from 'three'
import { GameConfig } from './types'

interface GridProps {
  config: GameConfig
}

export function Grid({ config }: GridProps) {
  const { gridSize, tileSize } = config
  const tiles: React.ReactNode[] = []

  // Generate grid tiles
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const posX = (x - (gridSize - 1) / 2) * tileSize
      const posZ = (z - (gridSize - 1) / 2) * tileSize

      // Checkerboard pattern
      const isLight = (x + z) % 2 === 0

      tiles.push(
        <mesh
          key={`tile-${x}-${z}`}
          position={[posX, -0.05, posZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[tileSize * 0.95, tileSize * 0.95]} />
          <meshStandardMaterial
            color={isLight ? '#e0e0e0' : '#c0c0c0'}
            side={THREE.DoubleSide}
          />
        </mesh>,
      )
    }
  }

  return <group>{tiles}</group>
}
