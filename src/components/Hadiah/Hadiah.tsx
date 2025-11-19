import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HadiahCard from './HadiahCard'

export interface Color {
  bg: string
  text: string
}

interface HadiahProps {
  pockys: Record<string, number>
  persons: string[]
  colors: Color[]
}

export default function Hadiah({ pockys, persons, colors }: HadiahProps) {
  const audioUrl = useRef<string>('/audio/yeey.mp3')
  const [availablePocky, setAvailablePocky] = useState<string[]>(() => {
    const pockyNames = []

    for (const [name, count] of Object.entries(pockys) as [string, number][]) {
      pockyNames.push(...Array(count).fill(name as string))
    }

    return pockyNames
  })

  const pickPocky = useCallback(
    (pickedPocky: (pocky: string) => void) => {
      if (availablePocky.length === 0) {
        return null
      }

      const randomIndex = Math.floor(Math.random() * availablePocky.length)

      const randomPockyName = availablePocky[randomIndex]

      pickedPocky(randomPockyName)
      /**
       * remove the picked pocky from the available pocky
       * We do it this way because the availablePockey contains the names
       * of the pocky, not the count of the pocky. For example:
       * ['Double Chocolate', 'Strawberry', 'Chocolate', 'Cookie Cream', 'Double Chocolate', 'Strawberry', 'Chocolate', 'Cookie Cream',]
       * Therefore, if we want to remove the 'Double Chocolate', we can't just filter the randomPockyName
       * because it will remove all the 'Double Chocolate' from the availablePocky.
       * Instead, we need to remove the 'Double Chocolate' from the availablePocky by its index.
       */
      availablePocky.splice(randomIndex, 1)

      /**
       * After splice call, the randomPockeyName now removed from  the availablePocky array
       * then we just need to update the state with the modified availablePocky array
       */

      setAvailablePocky([...availablePocky])
    },
    [availablePocky],
  )

  console.log(availablePocky)

  return (
    <div className="flex flex-col h-screen items-center align-middle justify-center">
      <h1 className="text-4xl font-bold">Pembagian Bingkisan</h1>
      <p className="text-sm text-gray-500">
        Pembagian bingkisan ini adalah untuk memberikan kebahagiaan kepada
        setiap orang yang ada di keluarga kami.
      </p>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          style={{ perspective: 1000 }}
        >
          <div className="grid grid-cols-5 gap-4 p-4 w-[1100px] mx-auto h-[80%]">
            {persons.map((personName, index) => (
              <HadiahCard
                key={index}
                personName={personName}
                color={colors[index]}
                index={index}
                onCardClick={pickPocky}
                audioUrl={audioUrl.current}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
