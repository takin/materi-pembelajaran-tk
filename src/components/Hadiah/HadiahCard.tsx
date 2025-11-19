import { useState, memo, useRef, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Color } from './Hadiah'

interface HadiahCardProps {
  personName: string
  color: Color
  index: number
  audioUrl: string
  animationDuration?: number
  onCardClick: (pickedPocky: (pocky: string) => void) => void
}

export interface Person {
  name: string
  pocky?: string
}
const HadiahCard = ({
  personName,
  color,
  index,
  onCardClick,
  audioUrl,
  animationDuration = 5000,
}: HadiahCardProps) => {
  const controls = useAnimationControls()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentPerson, setCurrentPerson] = useState<Person>({
    name: personName,
  })

  const soundRef = useRef<HTMLAudioElement | null>(null)

  const primeAudio = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = new Audio(audioUrl)
      soundRef.current.volume = 0.6
      soundRef.current.load()
    }
  }, [audioUrl])

  const playAudio = useCallback(() => {
    // Prevent playing audio multiple times
    if (!soundRef.current) {
      return
    }

    soundRef.current.currentTime = 0
    soundRef.current.play().catch((err) => {
      console.error('Failed to play audio:', err)
    })
  }, [])

  const handleClick = useCallback(async () => {
    /**
     * this will prevent the card to react
     * when the card is already flipped
     */
    if (isFlipped) return

    primeAudio()

    onCardClick((pocky) => {
      setCurrentPerson((prev) => ({ ...prev, pocky }))
    })

    // Start infinite rotation animation (this won't resolve because it's infinite)
    controls
      .start({
        rotate: 360,
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        },
      })
      .then(() => {
        setIsAnimating(true)
      })

    // After 5 seconds, stop animation and return to 0
    setTimeout(async () => {
      // Stop rotation and return to 0
      controls
        .start({
          rotate: 0,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        })
        .then(() => {
          setIsAnimating(false)
          setIsFlipped(true)
          playAudio()
        })
    }, animationDuration)
  }, [isFlipped])

  console.log('HadiahCard Component Rendered', index)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: 'easeOut',
      }}
    >
      <motion.div
        animate={controls}
        whileHover={!isFlipped && !isAnimating ? { scale: 1.2 } : {}}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={handleClick}
        className="cursor-pointer"
      >
        <Card
          className={`h-[220px] w-[180px] ${color.bg} relative overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardContent className="h-full flex items-center justify-center p-0">
            <div className="flex flex-col items-center justify-center h-full w-full">
              <h1 className={`text-xl capitalize font-bold ${color.text}`}>
                {currentPerson.name}
              </h1>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-full w-full"
              >
                <h2
                  className={`text-2xl capitalize font-bold text-center ${color.text}`}
                >
                  {isFlipped ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: isAnimating ? 0 : 0.8, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'backIn' }}
                    >
                      {currentPerson.pocky || '???'}
                    </motion.span>
                  ) : (
                    '???'
                  )}
                </h2>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default memo(HadiahCard, (prevProps, nextProps) => {
  return prevProps.color === nextProps.color
})
