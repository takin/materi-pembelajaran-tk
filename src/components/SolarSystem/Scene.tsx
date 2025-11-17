import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Slider } from '@/components/ui/slider'
import { PlanetCard } from './PlanetCard'
import { CameraController } from './CameraController'
import { planetData } from '../../data/planetData'
import OpenAI from 'openai'

function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function convertBase64ToBlob(base64: string): Blob {
  const byteString = atob(base64.split(',')[1])
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}

function getPlanetDataFromStorage(planetName: string): {
  description?: string
  audio?: string
} | null {
  try {
    const storedData = localStorage.getItem('planetData')
    if (!storedData) return null

    const allPlanetData = JSON.parse(storedData)
    return allPlanetData[planetName] || null
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return null
  }
}

function savePlanetDataToStorage(
  planetName: string,
  data: { description?: string; audio?: string },
) {
  try {
    const storedData = localStorage.getItem('planetData')
    const allPlanetData = storedData ? JSON.parse(storedData) : {}

    // Merge existing data with new data
    allPlanetData[planetName] = {
      ...allPlanetData[planetName],
      ...data,
    }

    localStorage.setItem('planetData', JSON.stringify(allPlanetData))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function Scene() {
  const [speedScale, setSpeedScale] = useState([1])
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [planetPosition, setPlanetPosition] = useState<THREE.Vector3 | null>(
    null,
  )
  const [planetDescription, setPlanetDescription] = useState<string | null>(
    null,
  )
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false)

  const openai = useRef<OpenAI | null>(null)
  const previousAudioUrlRef = useRef<string | null>(null)

  if (!openai.current) {
    openai.current = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  }

  const handlePlanetClick = (name: string, position: THREE.Vector3) => {
    setSelectedPlanet(name)
    setPlanetPosition(position.clone())
    setShouldAutoPlay(true) // Enable autoplay for this interaction
  }

  const handleCloseCard = () => {
    setSelectedPlanet(null)
    setPlanetPosition(null)
    setPlanetDescription(null)
    setShouldAutoPlay(false)
    // Clean up audio URL
    if (previousAudioUrlRef.current) {
      URL.revokeObjectURL(previousAudioUrlRef.current)
      previousAudioUrlRef.current = null
    }
    setAudioUrl(null)
  }

  useEffect(() => {
    const getPlanetDescription = async () => {
      if (!selectedPlanet) return

      // Check local storage first
      const cachedData = getPlanetDataFromStorage(selectedPlanet)
      if (cachedData?.description) {
        setPlanetDescription(cachedData.description)
        return
      }

      // If not in cache, fetch from API
      const response = await openai.current?.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Anda adalah seorang profesor astronomi yang ahli dalam memberikan penjelasan tentang planet-planet di tata surya. Anda akan memberikan penjelasan singkat dan padat tentang planet yang diminta, dengan fakta menarik dan informasi penting. Anda akan menjelaskan ini kepada anak-anak sekolah TK B dengan usia 5-6 tahun. Nama sekolahnya adalah TK Islam Cikal Cendikia, nama kelasnya adalah Kelas Al-Fil. Jelaskan dengan intonasi dan gaya bahasa yang menarik dan atraktif untuk anak-anak usia 5-6 tahun. gunakan penekanan intonasi yang sesuai dengan kondisi planet tersebut. Selalu sapa anak-anak dengan menyebut nama sekolahnya agar mereka merasa senang dan semakin bersemangat untuk belajar.`,
          },
          {
            role: 'user',
            content: `Ceritakan aku tentang planet ${selectedPlanet} dalam bahasa indonesia. Jelaskan secara singkat dan padat. Penjelasan harus mengandung fakta menarik dan informasi penting tentang planet tersebut.`,
          },
        ],
      })

      if (response?.choices[0].message.content) {
        const description = response.choices[0].message.content
        setPlanetDescription(description)
        // Save to local storage
        savePlanetDataToStorage(selectedPlanet, { description })
      }
    }
    getPlanetDescription()
  }, [selectedPlanet])

  useEffect(() => {
    const getPlanetDescriptionAudio = async () => {
      if (!planetDescription || !selectedPlanet) return

      setIsLoadingAudio(true)

      // Check local storage first
      const cachedData = getPlanetDataFromStorage(selectedPlanet)
      if (cachedData?.audio) {
        // Convert base64 back to blob URL
        try {
          // Clean up old audio URL if exists
          if (previousAudioUrlRef.current) {
            URL.revokeObjectURL(previousAudioUrlRef.current)
          }

          const blob = convertBase64ToBlob(cachedData.audio)
          const url = URL.createObjectURL(blob)
          previousAudioUrlRef.current = url
          setAudioUrl(url)
          setIsLoadingAudio(false)
          return
        } catch (error) {
          console.error('Error converting cached audio:', error)
          // Fall through to fetch from API
        }
      }

      // If not in cache, fetch from API
      try {
        const response = await openai.current?.audio.speech.create({
          model: 'gpt-4o-mini-tts',
          voice: 'alloy',
          input: planetDescription,
          response_format: 'mp3',
        })

        if (!response?.body) return

        // Clean up old audio URL if exists
        if (previousAudioUrlRef.current) {
          URL.revokeObjectURL(previousAudioUrlRef.current)
        }

        const audioBlob = await response.blob()
        const url = URL.createObjectURL(audioBlob)
        const base64 = await convertBlobToBase64(audioBlob)

        previousAudioUrlRef.current = url
        setAudioUrl(url)

        // Save to local storage
        savePlanetDataToStorage(selectedPlanet, { audio: base64 })
      } catch (error) {
        console.error('Error loading audio:', error)
      } finally {
        setIsLoadingAudio(false)
      }
    }
    getPlanetDescriptionAudio()
  }, [planetDescription, selectedPlanet])

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
          selectedPlanetName={selectedPlanet}
          onClose={handleCloseCard}
          planetDescription={planetDescription}
          audioUrl={audioUrl}
          isLoadingAudio={isLoadingAudio}
          shouldAutoPlay={shouldAutoPlay}
          onAutoPlayComplete={() => setShouldAutoPlay(false)}
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
