import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PlanetInfo } from '../../data/planetData'
import { X } from 'lucide-react'

interface PlanetCardProps {
  planetInfo: PlanetInfo
  onClose: () => void
  position: { x: number; y: number }
}

export function PlanetCard({ planetInfo, onClose, position }: PlanetCardProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <Card className="w-[380px] bg-black/90 backdrop-blur-lg border-white/20 text-white shadow-2xl">
        <CardHeader className="relative pb-3">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <CardTitle className="text-2xl font-bold">
            {planetInfo.name}
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm">
            {planetInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem label="Diameter" value={planetInfo.diameter} />
            <InfoItem
              label="Jarak dari Matahari"
              value={planetInfo.distanceFromSun}
            />
            <InfoItem label="Periode Orbit" value={planetInfo.orbitalPeriod} />
            <InfoItem
              label="Periode Rotasi"
              value={planetInfo.rotationPeriod}
            />
            <InfoItem label="Bulan" value={planetInfo.moons} />
            <InfoItem label="Komposisi" value={planetInfo.composition} />
            <InfoItem label="Suhu" value={planetInfo.temperature} />
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs font-semibold text-blue-400 mb-1">
              💡 Fakta Menarik
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {planetInfo.funFact}
            </p>
          </div>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-white font-semibold">{value}</p>
    </div>
  )
}
