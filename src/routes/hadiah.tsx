import { createFileRoute } from '@tanstack/react-router'
import Hadiah from '@/components/Hadiah'

export const Route = createFileRoute('/hadiah')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Hadiah />
}
