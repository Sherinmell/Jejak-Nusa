import type { AdrenalineLevel, TripCategory } from './trip'

export type TrailConditionStatus = 'Aman & Dibuka' | 'Waspada Cuaca' | 'Ditunda (Cuaca Ekstrem)'

export interface GearAddon {
  id: string
  name: string
  category: 'Perlengkapan' | 'Dokumentasi' | 'Logistik'
  price: number
  unit: string
  description: string
  recommendedFor: TripCategory[]
}

export interface PackingChecklistItem {
  id: string
  label: string
  required: boolean
  tip: string
}

export type BuddyTravelStyle =
  | 'Solo Traveler'
  | 'Cari Teman Sharing'
  | 'Fotografi Alam'
  | 'Pemula Santai'

export interface CommunityBuddyPost {
  id: string
  tripSlug: string
  tripTitle: string
  location: string
  authorName: string
  authorAvatar: string
  authorOrigin: string
  travelStyle: BuddyTravelStyle
  departureDate: string
  slotsLookingFor: number
  note: string
  likes: number
  createdAt: string
}

export interface TripParticipantPreview {
  id: string
  name: string
  origin: string
  avatar: string
  isSoloTraveler: boolean
  badge: string
}

export type BookingPaymentStatus = 'DP 30% Lunas' | 'Lunas 100%' | 'Menunggu Verifikasi'
export type GuideBookingStatus = 'Menunggu Konfirmasi' | 'Terkonfirmasi' | 'Check-in Selesai'

export interface GuideBookingRecord {
  id: string
  bookingCode: string
  tripSlug: string
  tripTitle: string
  departureDate: string
  leaderName: string
  leaderOrigin: string
  participantsCount: number
  isSoloTraveler: boolean
  hasInsurance: boolean
  addonsSummary: string[]
  emergencyContact: string
  paymentScheme: 'DP 30%' | 'Lunas 100%'
  paymentStatus: BookingPaymentStatus
  bookingStatus: GuideBookingStatus
  totalAmount: number
  paidAmount: number
}

export interface GuideManagedTrip {
  id: string
  slug: string
  title: string
  location: string
  category: TripCategory
  adrenalineLevel: AdrenalineLevel
  nextDepartureDate: string
  pricePerPerson: number
  totalQuota: number
  bookedCount: number
  trailStatus: TrailConditionStatus
  lastWeatherUpdate: string
}

export interface GuideDashboardResponse {
  guideName: string
  certifications: string[]
  escrowBalance: number
  monthlyRevenue: number
  activeParticipants: number
  averageRating: number
  safetyScore: number
  managedTrips: GuideManagedTrip[]
  bookings: GuideBookingRecord[]
}

export const GEAR_ADDONS: GearAddon[] = [
  {
    id: 'addon-shoes',
    name: 'Sewa Sepatu Outdoor / Water Grip',
    category: 'Perlengkapan',
    price: 65000,
    unit: 'per orang',
    description: 'Sepatu sol anti-slip khusus tebing basah, jalur gunung, atau gua karst.',
    recommendedFor: ['Trekking', 'Canyoning', 'Caving']
  },
  {
    id: 'addon-gopro',
    name: 'Paket Action Cam + Edit Video Reels',
    category: 'Dokumentasi',
    price: 150000,
    unit: 'per grup',
    description: 'Perekaman GoPro 4K anti-air selama trip + 1 video highlight siap unggah.',
    recommendedFor: ['Canyoning', 'Diving', 'Trekking', 'Caving']
  },
  {
    id: 'addon-drybag',
    name: 'Dry Bag 20L + Headlamp Lumen Tinggi',
    category: 'Perlengkapan',
    price: 45000,
    unit: 'per orang',
    description: 'Tas kedap air pelindung gadget & senter kepala tahan hujan/gua.',
    recommendedFor: ['Caving', 'Canyoning', 'Diving', 'Trekking']
  },
  {
    id: 'addon-porter',
    name: 'Porter Pribadi / Ekstra Logistik',
    category: 'Logistik',
    price: 220000,
    unit: 'per grup',
    description: 'Bantuan angkut carrier hingga 15 kg oleh porter lokal berpengalaman.',
    recommendedFor: ['Trekking']
  },
  {
    id: 'addon-dive-gear',
    name: 'Full Set Sewa Alat Selam (BCD + Reg + Fins)',
    category: 'Perlengkapan',
    price: 250000,
    unit: 'per orang',
    description: 'Peralatan scuba terawat yang disanitasi sebelum penyelaman.',
    recommendedFor: ['Diving']
  }
]

export const PACKING_CHECKLIST_BY_CATEGORY: Record<TripCategory, PackingChecklistItem[]> = {
  Trekking: [
    { id: 't1', label: 'Sepatu trekking berdaya cengkeram baik', required: true, tip: 'Hindari sepatu sneakers licin untuk jalur tanah & pasir.' },
    { id: 't2', label: 'Jaket windbreaker / thermal & jas hujan ponco', required: true, tip: 'Suhu puncak bisa turun hingga 5–10°C saat dini hari.' },
    { id: 't3', label: 'Headlamp + baterai cadangan', required: true, tip: 'Wajib untuk summit attack atau pendakian malam.' },
    { id: 't4', label: 'Botol minum reusable 1,5L & elektrolit', required: true, tip: 'Mendukung gerakan zero-waste di gunung.' },
    { id: 't5', label: 'Obat-obatan pribadi & plester luka', required: false, tip: 'Informasikan alergi atau riwayat asma ke pemandu.' }
  ],
  Canyoning: [
    { id: 'c1', label: 'Pakaian renang / rashguard cepat kering', required: true, tip: 'Dipakai di dalam wetsuit agar nyaman bergerak.' },
    { id: 'c2', label: 'Pakaian ganti kering & handuk kecil', required: true, tip: 'Simpan di basecamp untuk bilas setelah pengarungan.' },
    { id: 'c3', label: 'Sunblock ramah terumbu / sungai (reef-safe)', required: false, tip: 'Melindungi kulit tanpa mencemari air ngarai.' },
    { id: 'c4', label: 'Tali pengikat kacamata / waterproof pouch', required: false, tip: 'Mencegah kacamata atau ponsel jatuh saat rappelling.' }
  ],
  Diving: [
    { id: 'd1', label: 'Kartu sertifikasi selam (untuk Fun Dive) & logbook', required: true, tip: 'Pemula tanpa lisensi bisa memilih sesi Discover Scuba.' },
    { id: 'd2', label: 'Baju renang / rashguard lengan panjang', required: true, tip: 'Melindungi dari sinar UV & gesekan wetsuit.' },
    { id: 'd3', label: 'Sunscreen reef-safe & kacamata hitam', required: true, tip: 'Wajib bebas oxybenzone demi menjaga terumbu karang.' },
    { id: 'd4', label: 'Obat anti mabuk laut & jaket tipis dek kapal', required: false, tip: 'Berguna saat berlayar melintasi selat berarus.' }
  ],
  Caving: [
    { id: 'v1', label: 'Kaus kaki panjang tebal (di atas mata kaki)', required: true, tip: 'Wajib dipakai di dalam sepatu boots caving.' },
    { id: 'v2', label: 'Celana lapangan / trekking lentur & cepat kering', required: true, tip: 'Jalur gua lembap dan berlumpur.' },
    { id: 'v3', label: 'Pakaian ganti lengkap & kantong baju basah', required: true, tip: 'Tersedia kamar bilas di basecamp karst.' },
    { id: 'v4', label: 'Sarung tangan tipis anti-selip', required: false, tip: 'Membantu pegangan saat melintasi batu kapur basah.' }
  ]
}
