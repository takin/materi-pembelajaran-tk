export interface PlanetInfo {
  name: string
  description: string
  diameter: string
  distanceFromSun: string
  orbitalPeriod: string
  rotationPeriod: string
  moons: string
  composition: string
  temperature: string
  funFact: string
}

export const planetData: Record<string, PlanetInfo> = {
  Mercury: {
    name: 'Merkurius',
    description:
      'Planet terkecil dan terdekat dengan Matahari. Dinamai menurut dewa utusan Romawi.',
    diameter: '4.879 km',
    distanceFromSun: '57,9 juta km',
    orbitalPeriod: '88 hari Bumi',
    rotationPeriod: '59 hari Bumi',
    moons: '0',
    composition: 'Berbatu (inti besi)',
    temperature: '-173°C sampai 427°C',
    funFact: 'Merkurius memiliki variasi suhu paling ekstrem di tata surya!',
  },
  Venus: {
    name: 'Venus',
    description:
      'Planet terpanas, sering disebut kembaran Bumi karena ukurannya yang mirip. Dinamai menurut dewi cinta Romawi.',
    diameter: '12.104 km',
    distanceFromSun: '108,2 juta km',
    orbitalPeriod: '225 hari Bumi',
    rotationPeriod: '243 hari Bumi (retrograde)',
    moons: '0',
    composition: 'Berbatu dengan atmosfer tebal',
    temperature: '462°C (rata-rata)',
    funFact:
      'Satu hari di Venus lebih panjang dari satu tahunnya, dan berputar mundur!',
  },
  Earth: {
    name: 'Bumi',
    description:
      'Planet rumah kita, satu-satunya dunia yang diketahui memiliki kehidupan. Dinamai dari kata bahasa Inggris dan Jerman kuno untuk "tanah".',
    diameter: '12.742 km',
    distanceFromSun: '149,6 juta km',
    orbitalPeriod: '365,25 hari',
    rotationPeriod: '24 jam',
    moons: '1 (Bulan)',
    composition: 'Berbatu dengan inti besi',
    temperature: '-88°C sampai 58°C',
    funFact: '71% permukaan Bumi tertutup air, menjadikannya "Planet Biru"!',
  },
  Mars: {
    name: 'Mars',
    description:
      'Planet Merah, dinamai menurut dewa perang Romawi. Rumah bagi gunung berapi terbesar di tata surya.',
    diameter: '6.779 km',
    distanceFromSun: '227,9 juta km',
    orbitalPeriod: '687 hari Bumi',
    rotationPeriod: '24,6 jam',
    moons: '2 (Phobos, Deimos)',
    composition: 'Berbatu dengan debu besi oksida',
    temperature: '-87°C sampai -5°C',
    funFact:
      'Mars memiliki gunung tertinggi di tata surya: Olympus Mons (tinggi 21 km)!',
  },
  Jupiter: {
    name: 'Jupiter',
    description:
      'Planet terbesar di tata surya kita. Dinamai menurut raja para dewa Romawi. Raksasa gas dengan Bintik Merah Raksasa.',
    diameter: '139.820 km',
    distanceFromSun: '778,5 juta km',
    orbitalPeriod: '12 tahun Bumi',
    rotationPeriod: '10 jam',
    moons: '95 bulan yang diketahui',
    composition: 'Raksasa gas (hidrogen, helium)',
    temperature: '-108°C (puncak awan)',
    funFact:
      'Bintik Merah Raksasa Jupiter adalah badai yang telah mengamuk selama lebih dari 300 tahun!',
  },
  Saturn: {
    name: 'Saturnus',
    description:
      'Terkenal dengan cincinnya yang spektakuler. Dinamai menurut dewa pertanian Romawi. Raksasa gas dengan keindahan memukau.',
    diameter: '116.460 km',
    distanceFromSun: '1,43 miliar km',
    orbitalPeriod: '29 tahun Bumi',
    rotationPeriod: '10,7 jam',
    moons: '146 bulan yang diketahui',
    composition: 'Raksasa gas (hidrogen, helium)',
    temperature: '-138°C (rata-rata)',
    funFact:
      'Cincin Saturnus terbuat dari miliaran partikel es dan batu, beberapa sekecil butiran pasir!',
  },
  Uranus: {
    name: 'Uranus',
    description:
      'Raksasa es yang berputar miring. Dinamai menurut dewa langit Yunani. Memiliki warna biru-hijau yang unik.',
    diameter: '50.724 km',
    distanceFromSun: '2,87 miliar km',
    orbitalPeriod: '84 tahun Bumi',
    rotationPeriod: '17 jam (retrograde)',
    moons: '27 bulan yang diketahui',
    composition: 'Raksasa es (air, metana, amonia)',
    temperature: '-197°C (rata-rata)',
    funFact:
      'Uranus berputar dengan sudut 98°, membuatnya berputar miring seperti bola yang menggelinding!',
  },
  Neptune: {
    name: 'Neptunus',
    description:
      'Planet paling berangin dengan badai supersonik. Dinamai menurut dewa laut Romawi. Raksasa es yang jauh.',
    diameter: '49.244 km',
    distanceFromSun: '4,5 miliar km',
    orbitalPeriod: '165 tahun Bumi',
    rotationPeriod: '16 jam',
    moons: '14 bulan yang diketahui',
    composition: 'Raksasa es (air, metana, amonia)',
    temperature: '-201°C (rata-rata)',
    funFact:
      'Neptunus memiliki angin tercepat di tata surya, mencapai kecepatan 2.100 km/jam!',
  },
}
