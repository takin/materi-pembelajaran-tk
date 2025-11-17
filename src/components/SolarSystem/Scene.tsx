import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Slider } from '@/components/ui/slider'
import { PlanetCard } from './PlanetCard'
import { CameraController } from './CameraController'
import { PlanetTracker } from './PlanetTracker'
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

/**
 * Get cached planet/sun description from local storage
 * Audio is stored separately in IndexedDB due to size limitations
 */
function getPlanetDescriptionFromStorage(planetName: string): string | null {
  try {
    const storedData = localStorage.getItem('planetData')
    if (!storedData) {
      console.log(
        `[Cache] No description found in localStorage for ${planetName}`,
      )
      return null
    }

    const allPlanetData = JSON.parse(storedData)
    const description = allPlanetData[planetName]?.description || null

    if (description) {
      console.log(`[Cache] Found description for ${planetName}`)
    } else {
      console.log(
        `[Cache] No description found for ${planetName} in localStorage`,
      )
    }

    return description
  } catch (error) {
    console.error('Error reading description from localStorage:', error)
    return null
  }
}

/**
 * Save planet/sun description to local storage
 * Only saves description, audio is stored in IndexedDB separately
 */
function savePlanetDescriptionToStorage(
  planetName: string,
  description: string,
) {
  try {
    const storedData = localStorage.getItem('planetData')
    const allPlanetData = storedData ? JSON.parse(storedData) : {}

    // Only save description, not audio (audio goes to IndexedDB)
    if (!allPlanetData[planetName]) {
      allPlanetData[planetName] = {}
    }
    allPlanetData[planetName].description = description

    localStorage.setItem('planetData', JSON.stringify(allPlanetData))

    console.log(`[Cache] Saved description for ${planetName}`)
  } catch (error) {
    console.error('Error saving description to localStorage:', error)
  }
}

/**
 * Get audio from IndexedDB
 */
async function getAudioFromIndexedDB(
  planetName: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('SolarSystemCache', 1)

      request.onerror = () => {
        console.error('Error opening IndexedDB')
        resolve(null)
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audio'], 'readonly')
        const store = transaction.objectStore('audio')
        const getRequest = store.get(planetName)

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            console.log(`[Cache] Found audio in IndexedDB for ${planetName}`)
            resolve(getRequest.result.audio)
          } else {
            console.log(`[Cache] No audio found in IndexedDB for ${planetName}`)
            resolve(null)
          }
        }

        getRequest.onerror = () => {
          console.error('Error reading audio from IndexedDB')
          resolve(null)
        }
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'planetName' })
        }
      }
    } catch (error) {
      console.error('Error accessing IndexedDB:', error)
      resolve(null)
    }
  })
}

/**
 * Save audio to IndexedDB
 */
async function saveAudioToIndexedDB(
  planetName: string,
  audioBase64: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('SolarSystemCache', 1)

      request.onerror = () => {
        console.error('Error opening IndexedDB')
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audio'], 'readwrite')
        const store = transaction.objectStore('audio')
        const putRequest = store.put({
          planetName,
          audio: audioBase64,
        })

        putRequest.onsuccess = () => {
          console.log(`[Cache] Saved audio to IndexedDB for ${planetName}`)
          resolve()
        }

        putRequest.onerror = () => {
          console.error('Error saving audio to IndexedDB')
          reject(new Error('Failed to save audio'))
        }
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'planetName' })
        }
      }
    } catch (error) {
      console.error('Error accessing IndexedDB:', error)
      reject(error)
    }
  })
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

  // Helper functions to get planet orbit data
  const getPlanetOrbitRadius = (planetName: string): number => {
    const orbitRadii: Record<string, number> = {
      Mercury: 8,
      Venus: 12,
      Earth: 16,
      Mars: 20,
      Jupiter: 30,
      Saturn: 40,
      Uranus: 50,
      Neptune: 60,
    }
    return orbitRadii[planetName] || 0
  }

  const getPlanetOrbitSpeed = (planetName: string): number => {
    const orbitSpeeds: Record<string, number> = {
      Mercury: 4.15,
      Venus: 1.62,
      Earth: 1,
      Mars: 0.53,
      Jupiter: 0.084,
      Saturn: 0.034,
      Uranus: 0.012,
      Neptune: 0.006,
    }
    return orbitSpeeds[planetName] || 0
  }

  if (!openai.current) {
    openai.current = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  }

  const handlePlanetClick = (name: string, position: THREE.Vector3) => {
    console.log(`[Click] Planet/Sun clicked: ${name}`)
    setSelectedPlanet(name)
    // Set initial position - PlanetTracker will update it continuously
    if (name === 'Sun') {
      setPlanetPosition(new THREE.Vector3(0, 0, 0))
    } else {
      setPlanetPosition(position.clone())
    }
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

      console.log(`[Description] Fetching description for: ${selectedPlanet}`)

      // Check local storage first (works for planets and Sun)
      const cachedDescription = getPlanetDescriptionFromStorage(selectedPlanet)
      if (cachedDescription) {
        console.log(
          `[Description] Using cached description for: ${selectedPlanet}`,
        )
        setPlanetDescription(cachedDescription)
        return
      }

      console.log(
        `[Description] No cache found, fetching from API for: ${selectedPlanet}`,
      )

      // Determine if it's the Sun or a planet
      const isSun = selectedPlanet === 'Sun'
      const objectType = isSun ? 'matahari' : 'planet'

      // If not in cache, fetch from API
      const response = await openai.current?.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Anda adalah seorang profesor astronomi yang ahli dalam memberikan penjelasan tentang planet-planet di tata surya dan matahari. Anda akan memberikan penjelasan singkat dan padat tentang ${objectType} yang diminta, dengan fakta menarik dan informasi penting. Anda akan menjelaskan ini kepada anak-anak sekolah TK B dengan usia 5-6 tahun. Nama sekolahnya adalah TK Islam Cikal Cendikia, nama kelasnya adalah Kelas Al-Fil. Jelaskan dengan intonasi dan gaya bahasa yang menarik dan atraktif untuk anak-anak usia 5-6 tahun. Selalu sapa anak-anak dengan Salam dalam Agama Islam. Gunakan bahasa indonesia yang baik dan benar. Tambahkan juga penekanan pada kekuasaan Allah SWT.`,
          },
          {
            role: 'user',
            content: `Ceritakan aku tentang ${isSun ? 'matahari' : `planet ${selectedPlanet}`} dalam bahasa indonesia. Jelaskan secara singkat dan padat. Penjelasan harus mengandung fakta menarik dan informasi penting tentang ${objectType} tersebut.`,
          },
        ],
      })

      if (response?.choices[0].message.content) {
        const description = response.choices[0].message.content
        console.log(
          `[Description] Received description from API for: ${selectedPlanet}`,
        )
        setPlanetDescription(description)
        // Save to local storage (works for planets and Sun)
        savePlanetDescriptionToStorage(selectedPlanet, description)
      }
    }
    getPlanetDescription()
  }, [selectedPlanet])

  useEffect(() => {
    const getPlanetDescriptionAudio = async () => {
      if (!planetDescription || !selectedPlanet) return

      console.log(`[Audio] Fetching audio for: ${selectedPlanet}`)
      setIsLoadingAudio(true)

      // Check IndexedDB first (works for planets and Sun)
      const cachedAudio = await getAudioFromIndexedDB(selectedPlanet)
      if (cachedAudio) {
        console.log(
          `[Audio] Using cached audio from IndexedDB for: ${selectedPlanet}`,
        )
        // Convert base64 back to blob URL
        try {
          // Clean up old audio URL if exists
          if (previousAudioUrlRef.current) {
            URL.revokeObjectURL(previousAudioUrlRef.current)
          }

          const blob = convertBase64ToBlob(cachedAudio)
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
          voice: 'sage',
          instructions: `Affect/personality: Seorang ahli astronomi yang ahli dalam memberikan penjelasan tentang planet-planet di tata surya dan matahari dengan bahasa indonesia yang baik dan benar dan dengan gaya bahasa seorang guru TK.

Tone: Friendly, clear, dan menyenangkan, membuat suasana tenang dan membuat pembelajar merasa percaya diri dan nyaman.

Pronunciation: Jelas, bersahabat, dan tenang, memastikan setiap instruksi mudah dipahami sambil mempertahankan alur percakapan alami.

Pause: Singkat, tujuan berhenti setelah penjelasan penting (misalnya, "penjelasan tentang planet Venus") untuk memberikan waktu bagi pembelajar untuk memproses informasi dan mengikuti.

Emosi: Hangat dan mendukung, mengirimkan empati dan perhatian, memastikan pembelajar merasa dipandu dan aman sepanjang perjalanan.`,
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

        console.log(`[Audio] Received audio from API for: ${selectedPlanet}`)
        // Save to IndexedDB (works for planets and Sun)
        try {
          await saveAudioToIndexedDB(selectedPlanet, base64)
        } catch (error) {
          console.error('Failed to save audio to IndexedDB:', error)
          // Continue even if save fails
        }
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
          enablePan={!selectedPlanet}
          enableZoom={true}
          enableRotate={!selectedPlanet}
          minDistance={5}
          maxDistance={300}
        />

        {/* Camera Controller for zoom animation and tracking */}
        <CameraController
          targetPosition={planetPosition}
          isTracking={!!selectedPlanet}
        />

        {/* Planet Tracker - continuously updates position of selected planet */}
        {selectedPlanet && selectedPlanet !== 'Sun' && (
          <PlanetTracker
            planetName={selectedPlanet}
            orbitRadius={getPlanetOrbitRadius(selectedPlanet)}
            orbitSpeed={getPlanetOrbitSpeed(selectedPlanet)}
            speedScale={speedScale[0]}
            onPositionUpdate={(position) => {
              setPlanetPosition(position)
            }}
          />
        )}

        {/* Sun Tracker - for Sun position (static at center) */}
        {selectedPlanet === 'Sun' && (
          <PlanetTracker
            planetName="Sun"
            orbitRadius={0}
            orbitSpeed={0}
            speedScale={1}
            onPositionUpdate={() => {
              setPlanetPosition(new THREE.Vector3(0, 0, 0))
            }}
          />
        )}

        {/* Sun */}
        <Sun onClick={handlePlanetClick} />

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
