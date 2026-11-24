export type TripCategory = 'Trekking' | 'Canyoning' | 'Diving' | 'Caving'

export type AdrenalineLevel = 'Pemula' | 'Menengah' | 'Ekstrem'

export type TripAccommodationType = 'Hotel' | 'Homestay' | 'Camping' | 'None'

export interface TripRequirements {
  minAge: number
  requiresHealthCert: boolean
  requiresIdCard: boolean
  accommodationType: TripAccommodationType
  accommodationRules: string[]
  mandatoryGear: string[]
}

export type TripSortOption = 'recommended' | 'price-asc' | 'price-desc' | 'quota-asc' | 'rating-desc'

export interface GuideProfile {
  id: string
  name: string
  avatar: string
  origin: string
  verified: boolean
  certifications: string[]
  experienceYears: number
  completedTrips: number
  rating: number
  reviewCount: number
  languages: string[]
  responseTime: string
  bio: string
}

export interface ItineraryItem {
  day: string
  title: string
  activities: string[]
}

export interface TripReview {
  id: string
  author: string
  authorOrigin: string
  rating: number
  date: string
  comment: string
}

export interface Trip {
  id: string
  slug: string
  title: string
  location: string
  province: string
  category: TripCategory
  adrenalineLevel: AdrenalineLevel
  pricePerPerson: number
  duration: string
  nextDepartureDate: string
  totalQuota: number
  remainingQuota: number
  meetingPoint: string
  featured: boolean
  rating: number
  reviewCount: number
  coverImage: string
  gallery: string[]
  shortDescription: string
  description: string
  highlights: string[]
  itinerary: ItineraryItem[]
  included: string[]
  excluded: string[]
  guide: GuideProfile
  reviews: TripReview[]
  requirements?: TripRequirements
}

export function resolveTripRequirements(trip: Pick<Trip, 'slug' | 'category' | 'adrenalineLevel' | 'duration' | 'requirements'>): TripRequirements {
  if (trip.requirements) return trip.requirements

  const isOneDay = /1\s*Hari/i.test(trip.duration)
  const isExtreme = trip.adrenalineLevel === 'Ekstrem'
  const isModerate = trip.adrenalineLevel === 'Menengah'

  let accommodationType: TripAccommodationType = 'None'
  if (!isOneDay) {
    if (trip.slug.includes('rinjani')) {
      accommodationType = 'Camping'
    } else if (trip.category === 'Diving') {
      accommodationType = 'Hotel'
    } else {
      accommodationType = 'Homestay'
    }
  }

  const accommodationRules: string[] =
    accommodationType === 'Hotel'
      ? [
        'Waktu Check-in mulai pukul 14.00 dan Check-out maksimal pukul 12.00 waktu setempat.',
        'Pembagian kamar (sharing room) untuk solo traveler dipisahkan secara ketat sesuai gender.',
        'Pasangan suami-istri yang menginginkan kamar privat wajib menunjukkan KTP beralamat sama atau Buku Nikah (aturan syariah & penginapan mitra).',
        'Deposit keamanan kunci kamar sebesar Rp100.000/kamar (dikembalikan 100% saat check-out apabila tidak ada kerusakan).'
      ]
      : accommodationType === 'Homestay'
        ? [
          'Check-in basecamp/homestay mulai pukul 14.00 dan Check-out maksimal pukul 12.00 (penitipan tas gratis saat kegiatan berlangsung).',
          'Kamar sharing room dibagi berdasarkan gender untuk solo traveler; pasangan wajib membawa identitas resmi/bukti nikah sesuai ketentuan desa wisata.',
          'Deposit keamanan kunci & fasilitas homestay sebesar Rp50.000/kamar (dikembalikan penuh saat check-out).',
          'Wajib menjaga ketenangan lingkungan warga mulai pukul 22.00 serta dilarang membawa minuman beralkohol.'
        ]
        : accommodationType === 'Camping'
          ? [
            'Registrasi & check-in basecamp H-1 mulai pukul 14.00; tenda dome ekspedisi kapasitas 2–3 orang disiapkan oleh tim porter.',
            'Pembagian tenda sharing untuk solo traveler dipisahkan berdasarkan gender demi kenyamanan & kesopanan.',
            'Pasangan suami-istri yang memilih tenda privat wajib menunjukkan identitas resmi/bukti nikah di basecamp.',
            'Deposit keamanan perlengkapan tenda/sleeping bag sebesar Rp100.000/grup (dikembalikan utuh usai pendakian).'
          ]
          : []

  const mandatoryGear: string[] =
    trip.category === 'Trekking'
      ? [
        'Sepatu trekking/gunung ber-grip kuat (dilarang sandal jepit)',
        'Jaket windproof/thermal & jas hujan 2-piece',
        'Headlamp + baterai cadangan & botol minum min. 1,5L',
        'Obat pribadi & KTP/Paspor asli untuk Simaksi'
      ]
      : trip.category === 'Canyoning'
        ? [
          'Pakaian dalam renang / quick-dry layer untuk di dalam wetsuit',
          'Sepatu water shoes atau sepatu outdoor anti-slip',
          'Baju ganti kering, handuk microfiber & dry bag',
          'Kondisi fit (tidak memiliki fobia ketinggian/air ekstrem) & KTP asli'
        ]
        : trip.category === 'Diving'
          ? [
            'Baju renang / rashguard lengan panjang & sunblock reef-safe',
            'Sertifikat selam (OWD/AOWD) khusus paket fun dive bersertifikat',
            'Tidak melakukan penerbangan minimal 18 jam pasca penyelaman terakhir',
            'KTP/Paspor asli untuk manifest syahbandar & check-in penginapan'
          ]
          : [
            'Pakaian outdoor lengan panjang yang siap kotor oleh lumpur gua',
            'Kaos kaki panjang untuk sepatu boot karet yang disediakan panitia',
            'Dry bag & pakaian ganti lengkap beserta kantong baju basah',
            'KTP/Paspor asli & kondisi fisik tidak memiliki klaustrofobia berat'
          ]

  return {
    minAge: isExtreme ? 17 : isModerate ? 15 : 12,
    requiresHealthCert: isExtreme || trip.category === 'Diving' || (trip.category === 'Canyoning' && isModerate),
    requiresIdCard: true,
    accommodationType,
    accommodationRules,
    mandatoryGear
  }
}

export interface TripsApiResponse {
  trips: Trip[]
  total: number
  maxAvailablePrice: number
  categories: TripCategory[]
  levels: AdrenalineLevel[]
}

export interface TripFilterState {
  q: string
  category: TripCategory | ''
  level: AdrenalineLevel | ''
  maxPrice: number
  date: string
  sort: TripSortOption
}

export const TRIP_CATEGORIES: TripCategory[] = [
  'Trekking',
  'Canyoning',
  'Diving',
  'Caving'
]

export const ADRENALINE_LEVELS: AdrenalineLevel[] = [
  'Pemula',
  'Menengah',
  'Ekstrem'
]

export const ADVENTURE_INSURANCE_FEE = 50000
