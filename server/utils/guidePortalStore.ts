import type {
  GuideBookingRecord,
  GuideManagedTrip,
  TrailConditionStatus
} from '#shared/types/adventure'

export const guideManagedTripsStore: GuideManagedTrip[] = [
  {
    id: 'trip-canyoning-gitgit-bali',
    slug: 'canyoning-air-terjun-gitgit-bali',
    title: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    location: 'Buleleng, Bali Utara',
    category: 'Canyoning',
    adrenalineLevel: 'Menengah',
    nextDepartureDate: '2026-12-06',
    pricePerPerson: 1150000,
    totalQuota: 10,
    bookedCount: 7,
    trailStatus: 'Aman & Dibuka',
    lastWeatherUpdate: 'Hari ini, 08:15 WITA — Debit air normal, cerah berawan'
  },
  {
    id: 'trip-canyoning-cikaso-sukabumi',
    slug: 'canyoning-body-rafting-green-canyon-pangandaran',
    title: 'Canyoning & Extreme Body Rafting Green Canyon — Citumang',
    location: 'Pangandaran, Jawa Barat',
    category: 'Canyoning',
    adrenalineLevel: 'Ekstrem',
    nextDepartureDate: '2026-12-13',
    pricePerPerson: 890000,
    totalQuota: 12,
    bookedCount: 7,
    trailStatus: 'Waspada Cuaca',
    lastWeatherUpdate: 'Hari ini, 07:40 WIB — Pantauan curah hujan hulu Cijulang'
  }
]

export const guideBookingsStore: GuideBookingRecord[] = [
  {
    id: 'bk-101',
    bookingCode: 'JN-2612-084',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    departureDate: '2026-12-06',
    leaderName: 'Nadia Kusuma',
    leaderOrigin: 'Jakarta Selatan',
    participantsCount: 1,
    isSoloTraveler: true,
    hasInsurance: true,
    addonsSummary: ['Sepatu Water Grip (1x)', 'Paket Action Cam + Reels'],
    emergencyContact: 'Ibu Ratna (Ibu) — 0812-8890-4411',
    paymentScheme: 'Lunas 100%',
    paymentStatus: 'Lunas 100%',
    bookingStatus: 'Terkonfirmasi',
    totalAmount: 1415000,
    paidAmount: 1415000
  },
  {
    id: 'bk-102',
    bookingCode: 'JN-2612-091',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    departureDate: '2026-12-06',
    leaderName: 'Raka Mahendra (+2 teman)',
    leaderOrigin: 'Bandung',
    participantsCount: 3,
    isSoloTraveler: false,
    hasInsurance: true,
    addonsSummary: ['Dry Bag 20L (3x)'],
    emergencyContact: 'Dian Mahendra (Kakak) — 0811-2201-9980',
    paymentScheme: 'DP 30%',
    paymentStatus: 'DP 30% Lunas',
    bookingStatus: 'Menunggu Konfirmasi',
    totalAmount: 3735000,
    paidAmount: 1120500
  },
  {
    id: 'bk-103',
    bookingCode: 'JN-2612-104',
    tripSlug: 'canyoning-body-rafting-green-canyon-pangandaran',
    tripTitle: 'Canyoning & Extreme Body Rafting Green Canyon — Citumang',
    departureDate: '2026-12-13',
    leaderName: 'Dimas Prakoso (+1 teman)',
    leaderOrigin: 'Surabaya',
    participantsCount: 2,
    isSoloTraveler: false,
    hasInsurance: true,
    addonsSummary: ['Paket Action Cam + Reels'],
    emergencyContact: 'Hendra Prakoso (Ayah) — 0813-5541-2231',
    paymentScheme: 'Lunas 100%',
    paymentStatus: 'Lunas 100%',
    bookingStatus: 'Menunggu Konfirmasi',
    totalAmount: 2030000,
    paidAmount: 2030000
  }
]

export function updateTrailStatus(tripId: string, status: TrailConditionStatus) {
  const found = guideManagedTripsStore.find((t) => t.id === tripId)
  if (!found) return null
  found.trailStatus = status
  found.lastWeatherUpdate = `Diperbarui barusan — Status lapangan: ${status}`
  return found
}
