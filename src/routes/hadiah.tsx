import { createFileRoute } from '@tanstack/react-router'
import Hadiah from '@/components/Hadiah/Hadiah'

export const Route = createFileRoute('/hadiah')({
  component: RouteComponent,
  loader: async () => {
    const availablePocky = {
      'Double Chocolate': 3,
      Strawberry: 5,
      Chocolate: 1,
      'Cookie Cream': 4,
    }

    const persons = [
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
    ]

    const colors = [
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
    return {
      availablePocky,
      persons,
      colors,
    }
  },
})

function RouteComponent() {
  const { availablePocky, persons, colors } = Route.useLoaderData()
  return <Hadiah pockys={availablePocky} persons={persons} colors={colors} />
}
