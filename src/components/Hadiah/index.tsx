import { useMemo, useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HadiahCard from './HadiahCard'

export interface Color {
  bg: string
  text: string
}

export default function Hadiah() {
  const audioUrl = useRef<string>('/audio/yeey.mp3')

  const [availablePocky, setAvailablePocky] = useState<string[]>([
    'Double Chocolate',
    'Double Chocolate',
    'Double Chocolate',
    'Strawberry',
    'Strawberry',
    'Strawberry',
    'Strawberry',
    'Strawberry',
    'Chocolate',
    'Cookie Cream',
    'Cookie Cream',
    'Cookie Cream',
    'Cookie Cream',
  ])

  const persons = useMemo(
    () => [
      'Arsen',
      'Afan',
      'Rama',
      'Fajar',
      'Kiehl',
      'Pringga',
      'Mila',
      'Tanisha',
      'Nasywa',
      'Alesha',
      'Sherina',
      'Hanif',
      'Uwais',
    ],
    [],
  )

  const colors = useMemo(() => {
    return [
      {
        bg: 'bg-linear-to-br from-red-500 to-orange-500',
        text: 'text-red-800/90',
      },
      {
        bg: 'bg-linear-to-br from-green-500 to-lime-500',
        text: 'text-green-800/90',
      },
      {
        bg: 'bg-linear-to-br from-blue-500 to-indigo-500',
        text: 'text-blue-800/90',
      },
      {
        bg: 'bg-linear-to-br from-yellow-500 to-amber-500',
        text: 'text-yellow-800/90',
      },
      {
        bg: 'bg-linear-to-br from-purple-500 to-fuchsia-500',
        text: 'text-purple-800/90',
      },
      {
        bg: 'bg-linear-to-br from-pink-500 to-rose-500',
        text: 'text-pink-800/90',
      },
      {
        bg: 'bg-linear-to-br from-gray-500 to-zinc-500',
        text: 'text-gray-800/90',
      },
      {
        bg: 'bg-linear-to-br from-teal-500 to-cyan-500',
        text: 'text-teal-800/90',
      },
      {
        bg: 'bg-linear-to-br from-indigo-500 to-violet-500',
        text: 'text-indigo-800/90',
      },
      {
        bg: 'bg-linear-to-br from-emerald-500 to-lime-500',
        text: 'text-emerald-800/90',
      },
      {
        bg: 'bg-linear-to-br from-sky-500 to-blue-500',
        text: 'text-sky-800/90',
      },
      {
        bg: 'bg-linear-to-br from-rose-500 to-pink-500',
        text: 'text-rose-800/90',
      },
      {
        bg: 'bg-linear-to-br from-zinc-500 to-gray-500',
        text: 'text-zinc-800/90',
      },
    ]
  }, [])

  const pickPocky = useCallback((pickedPocky: (pocky: string) => void) => {
    if (availablePocky.length === 0) {
      return null
    }

    const randomPockyName =
      availablePocky[Math.floor(Math.random() * availablePocky.length)]

    pickedPocky(randomPockyName)

    setAvailablePocky((prev) =>
      prev.filter((pocky) => pocky !== randomPockyName),
    )
  }, [])

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
