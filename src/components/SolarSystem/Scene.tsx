import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Slider } from '@/components/ui/slider'
import { PlanetCard } from './PlanetCard'
import { CameraController } from './CameraController'
import { PlanetInfoOverlay } from './PlanetInfoOverlay'
import { planetData } from '../../data/planetData'

export function Scene() {
  const [speedScale, setSpeedScale] = useState([1])
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [planetPosition, setPlanetPosition] = useState<THREE.Vector3 | null>(
    null,
  )
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 })

  const handlePlanetClick = (name: string, position: THREE.Vector3) => {
    setSelectedPlanet(name)
    setPlanetPosition(position.clone())
  }

  const handleCloseCard = () => {
    setSelectedPlanet(null)
    setPlanetPosition(null)
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        position: 'relative',
      }}
    >
      <Canvas camera={{ position: [0, 50, 100], fov: 60 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2.5} />

        {/* Stars background */}
        <Stars radius={300} depth={60} count={5000} factor={7} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={300}
        />

        {/* Camera Controller for zoom animation */}
        <CameraController targetPosition={planetPosition} />

        {/* Planet Info Overlay for card positioning */}
        <PlanetInfoOverlay
          planetPosition={planetPosition}
          onPositionUpdate={(x, y) => setCardPosition({ x, y })}
        />

        {/* Sun */}
        <Sun />

        {/* Planets with realistic-ish orbital distances and sizes */}
        {/* Mercury */}
        <Planet
          name="Mercury"
          size={0.4}
          color="#D4AF77"
          orbitRadius={8}
          orbitSpeed={4.15}
          rotationSpeed={0.017}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Venus */}
        <Planet
          name="Venus"
          size={0.9}
          color="#FFD966"
          orbitRadius={12}
          orbitSpeed={1.62}
          rotationSpeed={0.004}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Earth */}
        <Planet
          name="Earth"
          size={1}
          color="#1E90FF"
          orbitRadius={16}
          orbitSpeed={1}
          rotationSpeed={1}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Mars */}
        <Planet
          name="Mars"
          size={0.5}
          color="#FF6347"
          orbitRadius={20}
          orbitSpeed={0.53}
          rotationSpeed={0.97}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Jupiter */}
        <Planet
          name="Jupiter"
          size={3}
          color="#F4A460"
          orbitRadius={30}
          orbitSpeed={0.084}
          rotationSpeed={2.4}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Saturn */}
        <Planet
          name="Saturn"
          size={2.5}
          color="#FFE4B5"
          orbitRadius={40}
          orbitSpeed={0.034}
          rotationSpeed={2.3}
          hasRings={true}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Uranus */}
        <Planet
          name="Uranus"
          size={1.5}
          color="#00CED1"
          orbitRadius={50}
          orbitSpeed={0.012}
          rotationSpeed={1.4}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />

        {/* Neptune */}
        <Planet
          name="Neptune"
          size={1.4}
          color="#4169E1"
          orbitRadius={60}
          orbitSpeed={0.006}
          rotationSpeed={1.5}
          speedScale={speedScale[0]}
          onClick={handlePlanetClick}
        />
      </Canvas>

      {/* Planet Info Card */}
      {selectedPlanet && planetData[selectedPlanet] && (
        <PlanetCard
          planetInfo={planetData[selectedPlanet]}
          onClose={handleCloseCard}
          position={cardPosition}
        />
      )}

      {/* Speed Control UI */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px 30px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '320px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '14px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: '500' }}>Kecepatan Rotasi</span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#4A90E2',
            }}
          >
            {speedScale[0].toFixed(1)}x
          </span>
        </div>
        <Slider
          value={speedScale}
          onValueChange={setSpeedScale}
          min={0}
          max={5}
          step={0.1}
          className="cursor-pointer"
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '11px',
            marginTop: '8px',
          }}
        >
          <span>0x</span>
          <span>5x</span>
        </div>
      </div>
    </div>
  )
}
