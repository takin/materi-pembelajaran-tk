import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanetInfo } from '../../data/planetData'
import { X, Volume2, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// Helper function to get planet image URL
const getPlanetImageUrl = (planetName: string): string => {
  // Using direct image URLs from reliable sources
  // These URLs point directly to image files and should be accessible
  const planetImages: Record<string, string> = {
    Mercury:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/600px-Mercury_in_true_color.jpg',
    Venus:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/600px-Venus-real_color.jpg',
    Earth:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/600px-The_Earth_seen_from_Apollo_17.jpg',
    Mars: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/600px-OSIRIS_Mars_true_color.jpg',
    Jupiter:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/600px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
    Saturn:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/600px-Saturn_during_Equinox.jpg',
    Uranus:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/600px-Uranus2.jpg',
    Neptune:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/600px-Neptune_Full.jpg',
  }

  return planetImages[planetName] || ''
}

interface PlanetCardProps {
  planetInfo: PlanetInfo
  selectedPlanetName: string
  onClose: () => void
  planetDescription: string | null
  audioUrl: string | null
  isLoadingAudio: boolean
  shouldAutoPlay: boolean
  onAutoPlayComplete: () => void
}

export function PlanetCard({
  planetInfo,
  selectedPlanetName,
  onClose,
  planetDescription,
  audioUrl,
  isLoadingAudio,
  shouldAutoPlay,
  onAutoPlayComplete,
}: PlanetCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [imageError, setImageError] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Reset displayed text and audio state when planet description changes
  useEffect(() => {
    if (planetDescription) {
      // Always hide text initially until audio starts
      setDisplayedText('')
      setAudioStarted(false)
    }
    // Reset image error when planet changes
    setImageError(false)
  }, [planetDescription, selectedPlanetName])

  // Typewriting animation that follows audio progress
  useEffect(() => {
    if (!planetDescription || !audioStarted) {
      // Hide text until audio starts
      setDisplayedText('')
      return
    }

    // If no audio or not playing, don't show text
    if (!audioRef.current || !isPlaying) {
      return
    }

    const audio = audioRef.current

    const updateText = () => {
      if (!audioRef.current || !planetDescription) return

      const currentAudio = audioRef.current

      // If audio is paused or ended, stop animation
      if (currentAudio.paused || currentAudio.ended) {
        if (currentAudio.ended) {
          setDisplayedText(planetDescription)
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        return
      }

      // Calculate progress and update text
      const duration = currentAudio.duration
      if (duration && !isNaN(duration) && duration > 0) {
        const progress = currentAudio.currentTime / duration

        if (progress >= 0 && progress <= 1) {
          const totalChars = planetDescription.length
          const currentChars = Math.floor(progress * totalChars)
          setDisplayedText(planetDescription.slice(0, currentChars))
        }
      }

      // Continue animation if still playing
      if (!currentAudio.paused && !currentAudio.ended) {
        animationFrameRef.current = requestAnimationFrame(updateText)
      }
    }

    const handleTimeUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      updateText()
    }

    // Add listener and start animation
    audio.addEventListener('timeupdate', handleTimeUpdate)
    updateText()

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [planetDescription, isPlaying, audioStarted])

  // Autoplay audio when URL is ready and autoplay is enabled
  useEffect(() => {
    if (audioUrl && shouldAutoPlay && !audioRef.current) {
      const audio = new Audio(audioUrl)
      audio.volume = 0.5
      audioRef.current = audio

      // Hide text initially
      setDisplayedText('')
      setAudioStarted(false)

      // When audio starts playing, show text and start typewriting
      const handlePlay = () => {
        setAudioStarted(true)
        setIsPlaying(true)
      }

      // When audio ends
      audio.onended = () => {
        setIsPlaying(false)
        // Show full text when audio ends
        if (planetDescription) {
          setDisplayedText(planetDescription)
        }
      }

      // Listen for play event
      audio.addEventListener('play', handlePlay)

      // Attempt to autoplay
      audio
        .play()
        .then(() => {
          // Play event will be triggered, which sets audioStarted and isPlaying
          onAutoPlayComplete() // Mark autoplay as completed
        })
        .catch((error) => {
          console.log('Autoplay was prevented:', error)
          // If autoplay fails, user can still manually play
          audio.removeEventListener('play', handlePlay)
          onAutoPlayComplete()
        })

      return () => {
        audio.removeEventListener('play', handlePlay)
      }
    }
  }, [audioUrl, shouldAutoPlay, onAutoPlayComplete, planetDescription])

  useEffect(() => {
    // Clean up audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayAudio = () => {
    if (!audioUrl) return

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Hide text when pausing, show when resuming
        if (!audioStarted) {
          setDisplayedText('')
        }
        audioRef.current.play()
        // play event will set audioStarted and isPlaying
      }
    } else {
      const audio = new Audio(audioUrl)
      audio.volume = 0.5
      audioRef.current = audio

      // Hide text initially
      setDisplayedText('')
      setAudioStarted(false)

      // When audio starts playing
      const handlePlay = () => {
        setAudioStarted(true)
        setIsPlaying(true)
      }

      audio.addEventListener('play', handlePlay)

      audio.onended = () => {
        setIsPlaying(false)
        // Show full text when audio ends
        if (planetDescription) {
          setDisplayedText(planetDescription)
        }
        audio.removeEventListener('play', handlePlay)
      }

      audio.play()
    }
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 p-4 z-50"
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <Card className="w-full bg-black/90 backdrop-blur-lg border-white/20 text-white shadow-2xl">
        <CardHeader className="relative pb-3">
          <div className="absolute right-4 top-4 flex gap-2">
            {audioUrl && (
              <button
                onClick={handlePlayAudio}
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                title="Putar narasi AI"
              >
                <Volume2
                  className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`}
                />
              </button>
            )}
            {isLoadingAudio && (
              <div className="rounded-full p-2 bg-gray-700">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <CardTitle className="text-2xl font-bold pr-24">
            {planetInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAudio && !planetDescription ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-3 text-gray-300">Memuat penjelasan...</span>
            </div>
          ) : planetDescription ? (
            <div className="flex gap-6 py-4">
              {/* Planet Image */}
              <div className="shrink-0">
                {!imageError ? (
                  <img
                    src={getPlanetImageUrl(selectedPlanetName)}
                    alt={planetInfo.name}
                    className="w-48 h-48 object-cover rounded-lg border border-white/20 shadow-lg"
                    onError={() => {
                      setImageError(true)
                    }}
                    onLoad={() => {
                      setImageError(false)
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg border border-white/20 shadow-lg bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {planetInfo.name}
                    </span>
                  </div>
                )}
              </div>
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                {audioStarted ? (
                  <p className="text-base text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {isPlaying &&
                    audioRef.current &&
                    !audioRef.current.ended ? (
                      <>
                        {displayedText || ''}
                        <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse" />
                      </>
                    ) : (
                      displayedText || planetDescription
                    )}
                  </p>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="ml-3 text-gray-300">
                      Memulai narasi...
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-base text-gray-400">
                Memuat penjelasan planet...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
