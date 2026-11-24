import type {
  CustomerBookingRecord,
  PlatformFeatureFlags,
  SosAlertRecord,
  TripLobbyMessage
} from '#shared/types/booking'
import type {
  GuideManagedTripItem,
  GuidePayoutRecord,
  GuideVerificationApplication,
  SimpleTrailWeatherStatus,
  WeatherRefundRecord
} from '#shared/types/guide'
import { resolveTripRequirements, type Trip } from '#shared/types/trip'
import { TRIPS_DATA } from './tripsData'

// Platform Feature Flags & Financial Configuration (controlled by Admin at /admin/features)
export const platformFeaturesStore: PlatformFeatureFlags = {
  qrisEnabled: true,
  splitBillDpEnabled: true,
  instantInsuranceEnabled: true,
  carbonOffsetEnabled: true,
  customTripEnabled: true,
  requireIdentityAndHealthCert: true,
  platformCommissionPercent: 10,
  serviceFeeAmount: 15000,
  updatedAt: '2026-11-24 00:00 WIB'
}

// Dynamic trips created by guides at runtime (merged with TRIPS_DATA)
export const dynamicTripsStore: Trip[] = []

// Guide managed packages with quotaOpen, SimpleTrailWeatherStatus, and Gear Checklist
export const guideManagedPackagesStore: GuideManagedTripItem[] = [
  {
    id: 'trip-canyoning-gitgit-bali',
    slug: 'canyoning-air-terjun-gitgit-bali',
    title: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    location: 'Buleleng, Bali Utara',
    province: 'Bali',
    category: 'Canyoning',
    adrenalineLevel: 'Menengah',
    duration: '1 Hari (Full Day)',
    nextDepartureDate: '2026-12-06',
    pricePerPerson: 1150000,
    totalQuota: 10,
    bookedCount: 7,
    quotaOpen: true,
    trailWeatherStatus: 'Buka',
    weatherNote: 'Debit air normal, langit cerah berawan, semua anchor rappelling lolos inspeksi.',
    coverImage: TRIPS_DATA[0]?.coverImage || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Basecamp Sambangan, Buleleng (07.30 WITA)',
    gearChecklist: [
      { id: 'gc-1', item: 'Baju renang / quick-dry layer dalam wetsuit', mandatory: true },
      { id: 'gc-2', item: 'Sepatu outdoor / water shoes anti-slip', mandatory: true },
      { id: 'gc-3', item: 'Baju ganti kering & handuk microfiber', mandatory: true },
      { id: 'gc-4', item: 'Obat pribadi & sunblock reef-safe', mandatory: false }
    ],
    itinerary: TRIPS_DATA[0]?.itinerary ?? []
  },
  {
    id: 'trip-trekking-rinjani-sembalun',
    slug: 'trekking-gunung-rinjani-sembalun-3h2m',
    title: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    location: 'Lombok Timur, NTB',
    province: 'Nusa Tenggara Barat',
    category: 'Trekking',
    adrenalineLevel: 'Ekstrem',
    duration: '3 Hari 2 Malam',
    nextDepartureDate: '2026-12-12',
    pricePerPerson: 2450000,
    totalQuota: 12,
    bookedCount: 9,
    quotaOpen: true,
    trailWeatherStatus: 'Waspada Hujan',
    weatherNote: 'Hujan ringan sore hari di Plawangan Sembalun — wajib jas hujan 2-piece & dry bag.',
    coverImage: TRIPS_DATA[1]?.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Basecamp Sembalun Lawang (06.30 WITA)',
    gearChecklist: [
      { id: 'gc-r1', item: 'Sepatu gunung mid/high-cut ber-grip kuat', mandatory: true },
      { id: 'gc-r2', item: 'Jaket gunung windproof + thermal down (suhu 2°C)', mandatory: true },
      { id: 'gc-r3', item: 'Headlamp + baterai cadangan untuk summit attack', mandatory: true },
      { id: 'gc-r4', item: 'Trekking pole sepasang & gaiter pasir', mandatory: false }
    ],
    itinerary: TRIPS_DATA[1]?.itinerary ?? []
  },
  {
    id: 'trip-canyoning-green-canyon',
    slug: 'canyoning-body-rafting-green-canyon-pangandaran',
    title: 'Canyoning & Extreme Body Rafting Green Canyon — Citumang',
    location: 'Pangandaran, Jawa Barat',
    province: 'Jawa Barat',
    category: 'Canyoning',
    adrenalineLevel: 'Ekstrem',
    duration: '2 Hari 1 Malam',
    nextDepartureDate: '2026-12-19',
    pricePerPerson: 890000,
    totalQuota: 12,
    bookedCount: 12,
    quotaOpen: false,
    trailWeatherStatus: 'Tutup',
    weatherNote: 'Debit sungai hulu Cijulang tinggi pasca hujan deras. Menunggu surut H-2.',
    coverImage: 'https://images.unsplash.com/photo-1504870712357-65ea720d6078?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Dermaga Ciseureuh, Pangandaran (07.00 WIB)',
    gearChecklist: [
      { id: 'gc-g1', item: 'Dry bag 10L–20L untuk ponsel & dompet', mandatory: true },
      { id: 'gc-g2', item: 'Sandal gunung tali belakang / water shoes', mandatory: true },
      { id: 'gc-g3', item: 'Pakaian quick-dry lengan panjang', mandatory: true }
    ],
    itinerary: [
      {
        day: 'Hari 1',
        title: 'Body Rafting Hulu Cijulang & Tebing Batu Payung',
        activities: ['Briefing keselamatan FAJI', 'Penyusuran arus 5 km', 'Lompat tebing & makan siang liwet']
      },
      {
        day: 'Hari 2',
        title: 'Eksplorasi Gua Bau & Citumang',
        activities: ['Trekking ringan hutan karst', 'Body rafting santai', 'Penutupan & pembagian dokumentasi']
      }
    ]
  }
]

// Real-time Shared Bookings Store (read by Customer, Guide, and Admin simultaneously!)
export const customerBookingsStore: CustomerBookingRecord[] = [
  {
    id: 'cbk-101',
    customerId: 'usr-customer-demo',
    bookingType: 'trip',
    invoiceNumber: 'INV-20261124-8842',
    bookingCode: 'JN-2612-084',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    location: 'Buleleng, Bali Utara',
    coverImage: TRIPS_DATA[0]?.coverImage || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    departureDate: '2026-12-06',
    guideId: 'guide-made-surya',
    guideName: 'I Made Surya Pratama',
    guideCertification: 'ICOpro Canyoning Guide Lv. 2',
    leaderName: 'Nadia Kusuma',
    customerPhone: '0812-8890-4411',
    customerEmail: 'customer@jejaknusa.id',
    specialNotes: 'Ukuran wetsuit M & L, tidak alergi makanan, butuh jemputan dari Canggu.',
    participantsCount: 2,
    hotelSubtotal: 0,
    shuttleFee: 0,
    paymentMethod: 'QRIS Instant Payment',
    paymentReference: 'QRIS-20261124-884201',
    paymentScheme: 'Lunas 100%',
    paymentStatus: 'LUNAS',
    bookingStatus: 'Terkonfirmasi',
    hasInsurance: true,
    hasCarbonOffset: true,
    packageSubtotal: 2300000,
    insuranceFee: 100000,
    carbonOffsetFee: 25000,
    serviceFee: 15000,
    totalAmount: 2440000,
    paidAmount: 2440000,
    remainingAmount: 0,
    splitPerPerson: 1220000,
    splitPaymentLink: 'https://jejaknusa.id/split/INV-20261124-8842',
    rosterNames: ['Nadia Kusuma (Lunas)', 'Bima Pratama (Lunas)'],
    agreementAccepted: true,
    participants: [
      {
        fullName: 'Nadia Kusuma',
        idNumber: '3174055208960004',
        emergencyContact: '0812-1100-7788 (Ibu Ratna)',
        medicalNotes: 'Tidak ada riwayat penyakit berat, alergi udang ringan.',
        agreementAccepted: true
      },
      {
        fullName: 'Bima Pratama',
        idNumber: '3174051903950002',
        emergencyContact: '0813-9088-1122 (Ayah Hendra)',
        medicalNotes: 'Sehat, tidak ada alergi.',
        agreementAccepted: true
      }
    ],
    gearChecklist: [
      { id: 'cgc-1', item: 'Baju renang / pakaian quick-dry dalam wetsuit', mandatory: true, checked: true },
      { id: 'cgc-2', item: 'Sepatu water grip / sandal gunung tali kuat', mandatory: true, checked: true },
      { id: 'cgc-3', item: 'Baju ganti kering & handuk microfiber', mandatory: true, checked: false },
      { id: 'cgc-4', item: 'Action cam + mounting dada (opsional)', mandatory: false, checked: false }
    ],
    checkedIn: false,
    createdAt: '2026-11-23 19:40 WIB',
    paidAt: '2026-11-23 19:42 WIB'
  },
  {
    id: 'cbk-102',
    customerId: 'usr-raka-demo',
    bookingType: 'trip',
    invoiceNumber: 'INV-20261124-7731',
    bookingCode: 'JN-2612-119',
    tripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    tripTitle: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    location: 'Lombok Timur, NTB',
    coverImage: TRIPS_DATA[1]?.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    departureDate: '2026-12-12',
    guideId: 'guide-bang-zainal',
    guideName: 'Zainal Abidin (Bang Zainal)',
    guideCertification: 'APGI Mountain Guide',
    leaderName: 'Raka Mahendra',
    customerPhone: '0811-2201-9980',
    customerEmail: 'raka.mahendra@mail.id',
    specialNotes: 'Vegetarian untuk makan malam di Plawangan, membawa trekking pole sendiri.',
    participantsCount: 3,
    hotelSubtotal: 0,
    shuttleFee: 0,
    paymentMethod: 'QRIS Instant Payment',
    paymentReference: 'QRIS-20261124-773109',
    paymentScheme: 'DP 30%',
    paymentStatus: 'DP 30% Lunas',
    bookingStatus: 'Terkonfirmasi',
    hasInsurance: true,
    hasCarbonOffset: true,
    packageSubtotal: 7350000,
    insuranceFee: 150000,
    carbonOffsetFee: 25000,
    serviceFee: 15000,
    totalAmount: 7540000,
    paidAmount: 2262000,
    remainingAmount: 5278000,
    splitPerPerson: 2513334,
    splitPaymentLink: 'https://jejaknusa.id/split/INV-20261124-7731',
    rosterNames: ['Raka Mahendra', 'Sinta Dewi', 'Bagas Putra'],
    agreementAccepted: true,
    participants: [
      {
        fullName: 'Raka Mahendra',
        idNumber: '3273011404940008',
        emergencyContact: '0811-7765-4321 (Dewi — Kakak)',
        medicalNotes: 'Riwayat asma ringan (membawa inhaler pribadi), menu vegetarian.',
        agreementAccepted: true
      },
      {
        fullName: 'Sinta Dewi',
        idNumber: '3273016509960001',
        emergencyContact: '0812-3344-5566 (Bpk. Agus)',
        medicalNotes: 'Alergi kacang tanah, fisik fit untuk trekking.',
        agreementAccepted: true
      },
      {
        fullName: 'Bagas Putra',
        idNumber: '3273012202930005',
        emergencyContact: '0815-8899-0011 (Ibu Sari)',
        medicalNotes: 'Tidak ada riwayat penyakit maupun alergi.',
        agreementAccepted: true
      }
    ],
    gearChecklist: [
      { id: 'cgc-r1', item: 'Sepatu gunung mid/high-cut anti-slip', mandatory: true, checked: true },
      { id: 'cgc-r2', item: 'Jaket gunung windproof + lapisan thermal', mandatory: true, checked: false },
      { id: 'cgc-r3', item: 'Headlamp & baterai cadangan summit attack', mandatory: true, checked: false },
      { id: 'cgc-r4', item: 'Sarung tangan hangat & kupluk', mandatory: false, checked: false }
    ],
    checkedIn: true,
    createdAt: '2026-11-23 15:10 WIB',
    paidAt: '2026-11-23 15:12 WIB'
  },
  {
    id: 'cbk-103',
    customerId: 'usr-clara-demo',
    bookingType: 'trip',
    invoiceNumber: 'INV-20261124-6620',
    bookingCode: 'JN-2612-135',
    tripSlug: 'diving-pulau-derawan-maratua-kakaban',
    tripTitle: 'Diving & Island Hopping Derawan — Maratua — Danau Kakaban',
    location: 'Berau, Kalimantan Timur',
    coverImage: TRIPS_DATA[6]?.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    departureDate: '2026-12-18',
    guideId: 'guide-hendra-berau',
    guideName: 'Hendra Wijaya',
    guideCertification: 'PADI Divemaster & POSSI',
    leaderName: 'Clara Wijaya',
    customerPhone: '0813-5541-2231',
    customerEmail: 'clara.wijaya@mail.id',
    specialNotes: 'Ukuran fin 39, butuh sewa BCD ukuran S.',
    participantsCount: 2,
    hotelSubtotal: 0,
    shuttleFee: 0,
    paymentMethod: 'QRIS Instant Payment',
    paymentReference: 'QRIS-20261124-662055',
    paymentScheme: 'Lunas 100%',
    paymentStatus: 'MENUNGGU PEMBAYARAN',
    bookingStatus: 'Menunggu Konfirmasi',
    hasInsurance: true,
    hasCarbonOffset: false,
    packageSubtotal: 6900000,
    insuranceFee: 100000,
    carbonOffsetFee: 0,
    serviceFee: 15000,
    totalAmount: 7015000,
    paidAmount: 0,
    remainingAmount: 7015000,
    splitPerPerson: 3507500,
    splitPaymentLink: 'https://jejaknusa.id/split/INV-20261124-6620',
    rosterNames: ['Clara Wijaya', 'Andi Pratama'],
    gearChecklist: [
      { id: 'cgc-d1', item: 'Lisensi selam (Open Water / setara)', mandatory: true, checked: true },
      { id: 'cgc-d2', item: 'Rashguard & sunblock reef-safe', mandatory: true, checked: false }
    ],
    checkedIn: false,
    createdAt: '2026-11-23 22:05 WIB'
  }
]

// Trip Lobby Chat messages
export const tripLobbyMessagesStore: TripLobbyMessage[] = [
  {
    id: 'msg-1',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    senderName: 'I Made Surya Pratama',
    senderRole: 'guide',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=80',
    message: 'Halo teman-teman rombongan 6 Des! Cuaca Buleleng cerah pagi ini. Jangan lupa sarapan ringan sebelum 07.30 WITA di basecamp ya.',
    createdAt: '08:12 WITA'
  },
  {
    id: 'msg-2',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    senderName: 'Raka Mahendra',
    senderRole: 'customer',
    senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=180&q=80',
    message: 'Siap Bli! Ada yang berangkat dari area Canggu pagi-pagi? Kami ada 2 kursi kosong di mobil buat sharing bensin.',
    createdAt: '08:25 WITA'
  },
  {
    id: 'msg-3',
    tripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    senderName: 'Zainal Abidin (Bang Zainal)',
    senderRole: 'guide',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80',
    message: 'Update Sembalun: Sore kemarin hujan tipis di Plawangan. Pastikan semua baju tidur dibungkus dry bag berlapis.',
    createdAt: '09:05 WITA'
  }
]

// Live Emergency SOS Alerts (Customer -> Admin Command Center)
export const sosAlertsStore: SosAlertRecord[] = [
  {
    id: 'sos-1001',
    tripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    tripTitle: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    reporterName: 'Dimas Prakoso',
    reporterRole: 'customer',
    latitude: -8.38294,
    longitude: 116.46281,
    locationLabel: 'Pos 3 Pada Balong, Jalur Sembalun (1.800 MDPL)',
    message: 'Anggota grup mengalami kram otot betis ringan, membutuhkan bantuan tim sweeper & tandu cadangan di Pos 3.',
    status: 'ACTIVE',
    createdAt: '2026-11-23 14:18 WITA'
  }
]

// Guide Verification Queue (Admin Verifications)
export const guideVerificationsStore: GuideVerificationApplication[] = [
  {
    id: 'ver-101',
    guideId: 'guide-pending-1',
    guideName: 'Bagus Wirawan',
    email: 'bagus.wirawan@guide.id',
    origin: 'Malang, Jawa Timur',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    licenseBody: 'APGI',
    licenseNumber: 'APGI-2025-08914-JTM',
    specialty: 'Trekking',
    experienceYears: 6,
    documentTitle: 'Sertifikat Kompetensi Pemandu Gunung Muda (APGI & BNSP)',
    documentPreviewUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80',
    submittedAt: '2026-11-22',
    status: 'pending'
  },
  {
    id: 'ver-102',
    guideId: 'guide-pending-2',
    guideName: 'Siti Rahma Karim',
    email: 'rahma.dive@komodolokal.id',
    origin: 'Labuan Bajo, NTT',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80',
    licenseBody: 'POSSI',
    licenseNumber: 'POSSI-CMAS-3S-44109',
    specialty: 'Diving',
    experienceYears: 8,
    documentTitle: 'Lisensi Divemaster POSSI / CMAS 3-Star & Rescue Diver',
    documentPreviewUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
    submittedAt: '2026-11-23',
    status: 'pending'
  },
  {
    id: 'ver-103',
    guideId: 'guide-made-surya',
    guideName: 'I Made Surya Pratama',
    email: 'guide@jejaknusa.id',
    origin: 'Singaraja, Bali',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    licenseBody: 'ICOpro',
    licenseNumber: 'ICOPRO-L2-ID-2024-772',
    specialty: 'Canyoning',
    experienceYears: 9,
    documentTitle: 'ICOpro Canyoning Instructor Level 2 & First Aid Wilderness',
    documentPreviewUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80',
    submittedAt: '2026-10-15',
    status: 'approved',
    reviewNote: 'Lisensi tervalidasi aktif hingga 2028.'
  }
]

// Guide Payouts Queue (Admin Payouts)
export const guidePayoutsStore: GuidePayoutRecord[] = [
  {
    id: 'pay-301',
    tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    guideName: 'I Made Surya Pratama',
    departureDate: '2026-11-16',
    participantsCount: 9,
    grossAmount: 10350000,
    commissionRate: 0.1,
    platformCommission: 1035000,
    netPayout: 9315000,
    status: 'Menunggu Pencairan'
  },
  {
    id: 'pay-302',
    tripTitle: 'Fun Diving & Liveaboard Taman Nasional Komodo — Manta Point',
    guideName: 'Yosep Fernandes',
    departureDate: '2026-11-18',
    participantsCount: 6,
    grossAmount: 26400000,
    commissionRate: 0.1,
    platformCommission: 2640000,
    netPayout: 23760000,
    status: 'Menunggu Pencairan'
  },
  {
    id: 'pay-303',
    tripTitle: 'Eksplorasi Gua Vertikal Jomblang & Hutan Purba Gunungkidul',
    guideName: 'Bagas Prakoso',
    departureDate: '2026-11-10',
    participantsCount: 10,
    grossAmount: 7800000,
    commissionRate: 0.1,
    platformCommission: 780000,
    netPayout: 7020000,
    status: 'Dicairkan',
    releasedAt: '2026-11-12'
  }
]

// Weather Refund Requests (Admin Payouts & Refunds)
export const weatherRefundsStore: WeatherRefundRecord[] = [
  {
    id: 'ref-201',
    bookingCode: 'JN-2611-210',
    customerName: 'Fajar Hidayat (+3 teman)',
    tripTitle: 'Canyoning & Extreme Body Rafting Green Canyon — Citumang',
    departureDate: '2026-11-29',
    weatherCondition: 'Peringatan BMKG: Hujan Lebat & Kenaikan Debit Sungai Hulu',
    reason: 'Jalur ditutup otomatis oleh pemandu karena keselamatan debit arus sungai.',
    refundAmount: 3560000,
    requestedAt: '2026-11-23',
    status: 'Menunggu Persetujuan'
  },
  {
    id: 'ref-202',
    bookingCode: 'JN-2611-198',
    customerName: 'Clara Wijaya',
    tripTitle: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    departureDate: '2026-11-25',
    weatherCondition: 'Angin Kencang >55 km/jam di Punggung Pelawangan',
    reason: 'Pengajuan pengembalian dana 100% sesuai Garansi Cuaca Ekstrem JejakNusa.',
    refundAmount: 2450000,
    requestedAt: '2026-11-22',
    status: 'Menunggu Persetujuan'
  }
]

export function getMergedCatalogTrips(): Trip[] {
  const map = new Map<string, Trip>()
  for (const trip of [...dynamicTripsStore, ...TRIPS_DATA]) {
    const withRequirements: Trip = {
      ...trip,
      requirements: resolveTripRequirements(trip)
    }
    const managed = guideManagedPackagesStore.find((m) => m.slug === trip.slug)
    if (managed) {
      map.set(trip.slug, {
        ...withRequirements,
        remainingQuota: managed.quotaOpen ? Math.max(0, managed.totalQuota - managed.bookedCount) : 0,
        totalQuota: managed.totalQuota
      })
    } else {
      map.set(trip.slug, withRequirements)
    }
  }
  return Array.from(map.values())
}

export function getTrailOverrideBySlug(slug: string): {
  status: SimpleTrailWeatherStatus
  note: string
  quotaOpen: boolean
} | null {
  const managed = guideManagedPackagesStore.find((m) => m.slug === slug)
  if (!managed) return null
  return {
    status: managed.trailWeatherStatus,
    note: managed.weatherNote,
    quotaOpen: managed.quotaOpen
  }
}
