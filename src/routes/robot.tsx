import { createFileRoute } from '@tanstack/react-router'
import { RobotGame } from '../components/RobotGame'

export const Route = createFileRoute('/robot')({
  component: RouteComponent,
})

function RouteComponent() {
  return <RobotGame />
}
