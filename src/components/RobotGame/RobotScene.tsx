import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Grid } from './Grid'
import { Robot } from './Robot'
import { GoalMarker } from './GoalMarker'
import { RobotState, GameConfig } from './types'

interface RobotSceneProps {
  robotState: RobotState
  goalPosition: { x: number; z: number }
  config: GameConfig
  isAnimating: boolean
}

export function RobotScene({ robotState, goalPosition, config, isAnimating }: RobotSceneProps) {
  return (
    <Canvas
      camera={{
        position: [8, 10, 8],
        fov: 50,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Camera controls - isometric-ish view */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Grid */}
      <Grid config={config} />

      {/* Robot */}
      <Robot state={robotState} config={config} isAnimating={isAnimating} />

      {/* Goal marker */}
      <GoalMarker position={goalPosition} config={config} />

      {/* Floor plane for shadows */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </Canvas>
  )
}

